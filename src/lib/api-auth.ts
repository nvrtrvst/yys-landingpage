import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthenticationError, ForbiddenError } from '@/lib/errors';

export async function requireRole(allowed: readonly string[]) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  if (!allowed.includes(session.user.role)) throw new ForbiddenError();
  return session;
}
