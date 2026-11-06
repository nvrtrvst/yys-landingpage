import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthenticationError, ForbiddenError } from "@/lib/errors";
import { hasModuleAccess, type ModuleKey } from "@/lib/modules";

export async function requireRole(allowed: readonly string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  if (!allowed.includes(session.user.role)) throw new ForbiddenError();
  return session;
}

export async function requireModuleOrRoles(module: ModuleKey, allowed: readonly string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  if (session.user.role === "petugas") {
    if (hasModuleAccess(session.user.role, session.user.permissions, module)) return session;
    throw new ForbiddenError();
  }

  if (!allowed.includes(session.user.role)) throw new ForbiddenError();
  return session;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  return session;
}
