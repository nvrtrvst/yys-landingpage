import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { requireRole, requireAuth } from '@/lib/api-auth';
import { AuthenticationError, ForbiddenError } from '@/lib/errors';

function sessionWithRole(role: string): Session {
  return { user: { id: '1', role, unit_id: null } } as unknown as Session;
}

beforeEach(() => {
  vi.mocked(getServerSession).mockReset();
});

describe('requireRole', () => {
  it('throws AuthenticationError without a session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    await expect(requireRole(['admin'])).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('throws ForbiddenError for a disallowed role', async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionWithRole('editor'));
    await expect(requireRole(['superadmin', 'admin'])).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns the session for an allowed role', async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionWithRole('admin'));
    const session = await requireRole(['superadmin', 'admin']);
    expect(session.user.role).toBe('admin');
  });
});

describe('requireAuth', () => {
  it('throws AuthenticationError without a session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    await expect(requireAuth()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('returns the session when authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionWithRole('guru'));
    const session = await requireAuth();
    expect(session.user.role).toBe('guru');
  });
});
