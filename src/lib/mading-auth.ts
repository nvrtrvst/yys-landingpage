import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logError } from "@/lib/errors";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  unit_id: number | null;
  photo: string | null;
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

export const madingAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Mading Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = getClientIpFromHeaders((req as { headers?: unknown }).headers as Headers | Record<string, string | string[]> | undefined);

        const ipLimit = checkRateLimit(`mading-login:ip:${ip}`, 30, 60 * 1000);
        if (!ipLimit.allowed) { console.log("MADING AUTH: ip limit hit"); return null; }

        try {
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT id, name, email, password, role, unit_id, photo, failed_attempts, locked_until FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = rows[0];
          if (!user) { console.log("MADING AUTH: user not found"); return null; }

          if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
            console.log("MADING AUTH: locked"); throw new Error("LOCKED");
          }

          if (!["guru", "siswa"].includes(user.role)) { console.log("MADING AUTH: wrong role", user.role); return null; }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) { console.log("MADING AUTH: wrong password");
            const newAttempts = (user.failed_attempts || 0) + 1;
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
              await pool.execute(
                "UPDATE users SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
                [newAttempts, ACCOUNT_LOCK_MINUTES, user.id]
              );
            } else {
              await pool.execute("UPDATE users SET failed_attempts = ? WHERE id = ?", [newAttempts, user.id]);
            }
            return null;
          }

          console.log("MADING AUTH: login success", { role: user.role, userId: user.id });
          await pool.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [user.id]);

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            unit_id: user.unit_id,
            photo: user.photo,
          };
        } catch (error) {
          if (error instanceof Error && error.message === "LOCKED") throw error;
          logError(error, 'Mading Auth');
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? token.role;
        token.id = user.id ?? token.id;
        token.unit_id = user.unit_id ?? token.unit_id;
        token.photo = (user as { photo?: string | null }).photo ?? token.photo ?? null;
      }
      if (token.id) {
        try {
          const [rows] = await pool.execute<RowDataPacket[]>(
            "SELECT photo FROM users WHERE id = ?",
            [token.id]
          );
          const row = rows[0] as { photo: string | null } | undefined;
          if (row) token.photo = row.photo ?? null;
        } catch {
          /* keep existing token.photo */
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.unit_id = token.unit_id as number | null;
        session.user.photo = (token.photo as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/mading/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "mading.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "mading.callback-url",
      options: { path: "/", sameSite: "strict" },
    },
    csrfToken: {
      name: "mading.csrf-token",
      options: { path: "/", sameSite: "strict" },
    },
    pkceCodeVerifier: {
      name: "mading.pkce.code_verifier",
      options: { path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" },
    },
    state: {
      name: "mading.state",
      options: { path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" },
    },
    nonce: {
      name: "mading.nonce",
      options: { path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getServerSessionDual() {
  const mading = await getServerSession(madingAuthOptions);
  if (mading) return mading;
  return getServerSession(authOptions);
}
