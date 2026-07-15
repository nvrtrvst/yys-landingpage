import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/errors";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  unit_id: number | null;
  failed_attempts: number;
  locked_until: Date | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      unit_id: number | null;
      name?: string | null;
      email?: string | null;
      photo?: string | null;
    };
  }
  interface User {
    role: string;
    unit_id: number | null;
    photo?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    unit_id: number | null;
    photo?: string | null;
  }
}

const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10);
const ACCOUNT_LOCK_MINUTES = parseInt(process.env.ACCOUNT_LOCK_MINUTES || '15', 10);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@yayasan.com" },
        password: { label: "Password", type: "password" },
      },
      async   authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const ip = getClientIpFromHeaders((req as { headers?: unknown }).headers as Headers | Record<string, string | string[]> | undefined);

        // 1. Rate limit per IP (throttle global)
        const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 60 * 1000);
        if (!ipLimit.allowed) return null;

        // 2. Rate limit per email (blokir 1 akun)
        const emailLimit = checkRateLimit(`login:email:${credentials.email.toLowerCase()}`, 5, 15 * 60 * 1000);
        if (!emailLimit.allowed) return null;

        try {
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT id, name, email, password, role, unit_id, failed_attempts, locked_until FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = rows[0];

          if (!user) {
            return null;
          }

          // 3. Cek lockout
          if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
            throw new Error("LOCKED");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            const newAttempts = (user.failed_attempts || 0) + 1;
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
              await pool.execute(
                "UPDATE users SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
                [newAttempts, ACCOUNT_LOCK_MINUTES, user.id]
              );
            } else {
              await pool.execute(
                "UPDATE users SET failed_attempts = ? WHERE id = ?",
                [newAttempts, user.id]
              );
            }
            return null;
          }

          // 4. Tolak guru/siswa — mereka pakai /mading/login
          if (["guru", "siswa"].includes(user.role)) return null;

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
            unit_id: user.unit_id,
          };
        } catch (error) {
          if (error instanceof Error && error.message === "LOCKED") {
            throw error;
          }
          logError(error, 'SCP Auth');
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
        token.unit_id = user.unit_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.unit_id = token.unit_id as number | null;
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
