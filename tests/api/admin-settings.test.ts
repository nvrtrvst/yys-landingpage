import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';
import type { RowDataPacket } from 'mysql2';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: { execute: vi.fn() } }));

import { getServerSession } from 'next-auth';
import pool from '@/lib/db';
import { GET } from '@/app/api/admin/settings/route';

function sessionWithRole(role: string): Session {
  return { user: { id: '1', role, unit_id: null } } as unknown as Session;
}

function request() {
  return new Request('http://localhost/api/admin/settings');
}

beforeEach(() => {
  vi.mocked(getServerSession).mockReset();
  vi.mocked(pool.execute).mockReset();
});

describe('GET /api/admin/settings', () => {
  it('returns 401 without a session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admin roles', async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionWithRole('editor'));
    const response = await GET(request());
    expect(response.status).toBe(403);
  });

  it('returns key/value settings for admins', async () => {
    vi.mocked(getServerSession).mockResolvedValue(sessionWithRole('admin'));
    const rows = [
      { setting_key: 'site_name', setting_value: 'Yayasan Nuurul Muttaqiin' },
    ] as RowDataPacket[];
    vi.mocked(pool.execute).mockResolvedValue(
      [rows, []] as unknown as Awaited<ReturnType<typeof pool.execute>>
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      site_name: 'Yayasan Nuurul Muttaqiin',
    });
  });
});
