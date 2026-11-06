import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.hoisted(() => {
  process.env.KEUANGAN_INTEGRATION_KEY = 'test-key';
  process.env.KEUANGAN_API_URL = 'http://keu.test';
});

vi.mock('@/lib/db', () => ({ default: { execute: vi.fn() } }));

import pool from '@/lib/db';
import { syncPpdbSubmission } from '@/lib/sim-sync';

function submission(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    registration_number: 'PPDB-X',
    status: 'Diterima',
    sync_status: 'pending',
    nisn: '123',
    student_name: 'Ani',
    gender: 'Perempuan',
    birth_date: '2010-01-01',
    address: 'Jl',
    phone: '08',
    email: 'a@b.c',
    father_name: 'Bapak',
    guardian_name: null,
    unit: 'SD',
    grade: '1',
    major: null,
    ...overrides,
  };
}

function mockDb(rows: unknown[]) {
  vi.mocked(pool.execute).mockResolvedValue([rows, []] as never);
}

beforeEach(() => {
  vi.mocked(pool.execute).mockReset();
  vi.unstubAllGlobals();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('syncPpdbSubmission', () => {
  it('posts the mapped payload and stores success', async () => {
    mockDb([submission()]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 'std_1', warnings: ['kelas'] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncPpdbSubmission(1);

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(['kelas']);
    const init = fetchMock.mock.calls[0][1] as RequestInit | undefined;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      registrationNumber: 'PPDB-X',
      unit: 'SD',
      name: 'Ani',
      gender: 'P',
      birthDate: '2010-01-01',
      parentName: 'Bapak',
    });
    expect(pool.execute).toHaveBeenLastCalledWith(
      expect.stringContaining("sync_status = 'success'"),
      expect.any(Array)
    );
  });

  it('skips a submission that already succeeded', async () => {
    mockDb([submission({ sync_status: 'success' })]);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncPpdbSubmission(1);

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks failed when keu rejects the request', async () => {
    mockDb([submission()]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unit "ZZZ" tidak ditemukan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const result = await syncPpdbSubmission(1);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('tidak ditemukan');
    expect(pool.execute).toHaveBeenLastCalledWith(
      expect.stringContaining("sync_status = 'failed'"),
      expect.any(Array)
    );
  });

  it('marks failed on timeout', async () => {
    mockDb([submission()]);
    const timeout = new Error('timeout');
    timeout.name = 'TimeoutError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeout));

    const result = await syncPpdbSubmission(1);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('timeout');
  });

  it('reports alreadyExists without duplicating', async () => {
    mockDb([submission()]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, alreadyExists: true, data: { id: 'std_1', warnings: [] } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    const result = await syncPpdbSubmission(1);

    expect(result.ok).toBe(true);
    expect(result.alreadyExists).toBe(true);
  });
});
