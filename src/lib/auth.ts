import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import pool, { getSettings } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { checkRateLimit } from "@/lib/rate-limit";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  failed_attempts: number;
  locked_until: Date | null;
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function getClientIp(req: unknown): string {
  const headers = (req as { headers?: Record<string, string | string[]> | Headers }).headers;
  if (!headers) return "unknown";
  const get = (key: string): string | undefined => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(key) || undefined;
    }
    const v = (headers as Record<string, string | string[]>)[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const xff = get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return get("x-real-ip") || "unknown";
}

async function verifyRecaptcha(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!secret) {
    console.warn("[auth] recaptcha_secret belum dikonfigurasi di Settings — verifikasi CAPTCHA dilewati.");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@yayasan.com" },
        password: { label: "Password", type: "password" },
        recaptcha: { label: "Captcha", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const ip = getClientIp(req);

        // 1. Rate limit per IP (throttle global)
        const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 60 * 1000);
        if (!ipLimit.allowed) return null;

        // 2. Rate limit per email (blokir 1 akun)
        const emailLimit = checkRateLimit(`login:email:${credentials.email.toLowerCase()}`, 5, 15 * 60 * 1000);
        if (!emailLimit.allowed) return null;

        // 3. Verifikasi CAPTCHA
        const settings = await getSettings();
        const recaptchaOk = await verifyRecaptcha(credentials.recaptcha, settings.recaptcha_secret);
        if (!recaptchaOk) return null;

        try {
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT id, name, email, password, role, failed_attempts, locked_until FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = rows[0];

          if (!user) {
            return null;
          }

          // 4. Cek lockout
          if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            const newAttempts = (user.failed_attempts || 0) + 1;
            if (newAttempts >= MAX_FAILED) {
              await pool.execute(
                "UPDATE users SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
                [newAttempts, LOCK_MINUTES, user.id]
              );
            } else {
              await pool.execute(
                "UPDATE users SET failed_attempts = ? WHERE id = ?",
                [newAttempts, user.id]
              );
            }
            return null;
          }

          // 5. Sukses — reset lockout
          await pool.execute(
            "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
            [user.id]
          );

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/scp/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — reduced from 30 days for admin security
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
