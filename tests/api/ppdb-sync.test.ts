import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api-auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: '1', name: 'Admin', role: 'admin', permissions: [] } }),
  requireModuleOrRoles: vi.fn().mockResolvedValue({ user: { id: '1', name: 'Admin', role: 'admin', permissions: [] } }),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimitOrThrow: vi.fn(),
  getClientIp: () => '1.1.1.1',
}));
vi.mock('@/lib/db', () => ({ default: { execute: vi.fn() } }));
vi.mock('@/lib/sim-sync', () => ({
  syncPpdbSubmission: vi.fn(),
  deactivatePpdbStudent: vi.fn(),
}));

import { syncPpdbSubmission } from '@/lib/sim-sync';
import { POST as syncOne } from '@/app/api/admin/ppdb/[id]/sync/route';
import { POST as syncBulk } from '@/app/api/admin/ppdb/sync/route';

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function post(body?: unknown) {
  return new Request('http://localhost/api/admin/ppdb/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(syncPpdbSubmission).mockReset();
});

describe('POST /api/admin/ppdb/[id]/sync', () => {
  it('returns the sync result', async () => {
    vi.mocked(syncPpdbSubmission).mockResolvedValue({ ok: true, warnings: [] });

    const response = await syncOne(post(), params('5'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, warnings: [] });
    expect(syncPpdbSubmission).toHaveBeenCalledWith(5, {
      force: true,
      actor: { id: 1, name: 'Admin', role: 'admin' },
      trigger: 'manual',
    });
  });

  it('rejects an invalid id', async () => {
    const response = await syncOne(post(), params('abc'));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/ppdb/sync (bulk)', () => {
  it('summarizes mixed results', async () => {
    vi.mocked(syncPpdbSubmission)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, alreadyExists: true })
      .mockResolvedValueOnce({ ok: false, error: 'x' })
      .mockResolvedValueOnce({ ok: true, skipped: true });

    const response = await syncBulk(post({ ids: [1, 2, 3, 4] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      summary: { total: 4, success: 1, alreadyExists: 1, skipped: 1, failed: 1 },
    });
  });
});
