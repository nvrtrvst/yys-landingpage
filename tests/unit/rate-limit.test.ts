import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checkRateLimit', () => {
  it('allows requests up to the limit, then blocks', () => {
    const key = `limit-${Math.random()}`;
    expect(checkRateLimit(key, 2, 1000)).toEqual({ allowed: true, remaining: 1 });
    expect(checkRateLimit(key, 2, 1000)).toEqual({ allowed: true, remaining: 0 });
    expect(checkRateLimit(key, 2, 1000)).toEqual({ allowed: false, remaining: 0 });
  });

  it('tracks keys independently', () => {
    const first = `a-${Math.random()}`;
    const second = `b-${Math.random()}`;
    expect(checkRateLimit(first, 1, 1000).allowed).toBe(true);
    expect(checkRateLimit(first, 1, 1000).allowed).toBe(false);
    expect(checkRateLimit(second, 1, 1000).allowed).toBe(true);
  });

  it('resets after the window expires', () => {
    const key = `window-${Math.random()}`;
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(true);
    now.mockReturnValue(1_500);
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(false);
    now.mockReturnValue(2_001);
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(true);
  });
});

describe('getClientIpFromHeaders', () => {
  it('uses the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIpFromHeaders(headers)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip from a plain record', () => {
    expect(getClientIpFromHeaders({ 'x-real-ip': '9.9.9.9' })).toBe('9.9.9.9');
  });

  it('returns unknown when headers are missing', () => {
    expect(getClientIpFromHeaders(undefined)).toBe('unknown');
  });
});
