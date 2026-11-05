import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/ppdb/majors/route';

function request(unit = 'SD') {
  return new Request(`http://localhost/api/ppdb/majors?unit=${unit}`, {
    headers: { 'x-forwarded-for': '1.1.1.1' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.KEUANGAN_INTEGRATION_KEY;
  delete process.env.KEUANGAN_API_URL;
});

describe('GET /api/ppdb/majors', () => {
  it('returns 500 when the integration key is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await GET(request());
    expect(response.status).toBe(500);
  });

  it('proxies majors data on success', async () => {
    process.env.KEUANGAN_INTEGRATION_KEY = 'test-key';
    process.env.KEUANGAN_API_URL = 'http://keuangan.test';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ id: 'mjr_1', name: 'DKV' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [{ id: 'mjr_1', name: 'DKV' }],
    });
  });

  it('returns 500 when the upstream call fails', async () => {
    process.env.KEUANGAN_INTEGRATION_KEY = 'test-key';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 502 })));

    const response = await GET(request());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Gagal menghubungi server pusat' });
  });
});
