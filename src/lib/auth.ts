import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/errors";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string | null;
  unit_id: number | null;
  failed_attempts: number;
  locked_until: Date | null;
}

function parsePermissions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is string => typeof value === "string" && MODULE_KEYS.includes(value as ModuleKey)
    );
  } catch {
    return [];
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      unit_id: number | null;
      name?: string | null;
      email?: string | null;
      photo?: string | null;
    };
  }
  interface User {
    role: string;
    permissions: string[];
    unit_id: number | null;
    photo?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    permissions: string[];
    permissionsUpdatedAt: number;
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

        const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 60 * 1000);
        if (!ipLimit.allowed) return null;

        const emailLimit = checkRateLimit(`login:email:${credentials.email.toLowerCase()}`, 5, 15 * 60 * 1000);
        if (!emailLimit.allowed) return null;

        try {
          const [rows] = await pool.execute<UserRow[]>(
            "SELECT id, name, email, password, role, permissions, unit_id, failed_attempts, locked_until FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = rows[0];

          if (!user) {
            return null;
          }

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

          // Guru/siswa memakai /mading/login.
          if (["guru", "siswa"].includes(user.role)) return null;

          await pool.execute(
            "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
            [user.id]
          );

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: parsePermissions(user.permissions),
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
        token.permissions = user.permissions ?? [];
        token.permissionsUpdatedAt = Date.now();
      }

      // Keep petugas permissions fresh without a DB query on every request.
      if (token.role === "petugas") {
        const lastRefresh = Number(token.permissionsUpdatedAt || 0);
        if (Date.now() - lastRefresh > 5 * 60 * 1000) {
          try {
            const [rows] = await pool.execute<RowDataPacket[]>(
              "SELECT role, permissions, unit_id FROM users WHERE id = ?",
              [token.id]
            );
            const fresh = rows[0];
            if (fresh) {
              token.role = fresh.role;
              token.permissions = parsePermissions(fresh.permissions);
              token.unit_id = fresh.unit_id;
            }
          } catch (error) {
            logError(error, "SCP permission refresh");
          }
          token.permissionsUpdatedAt = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.permissions = (token.permissions as string[]) ?? [];
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
