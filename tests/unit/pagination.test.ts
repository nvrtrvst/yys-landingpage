import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ default: { execute: vi.fn() } }));
vi.mock('isomorphic-dompurify', () => ({
  default: { sanitize: (value: string) => value },
}));

import { getPagination } from '@/lib/mading';

describe('getPagination', () => {
  it('applies defaults', () => {
    expect(getPagination()).toEqual({ page: 1, limit: 12, offset: 0 });
  });

  it('clamps page below 1 and limit outside 1..50', () => {
    expect(getPagination(0, 0)).toEqual({ page: 1, limit: 1, offset: 0 });
    expect(getPagination(-3, 100)).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it('falls back to defaults for non-finite values', () => {
    expect(getPagination(Number.NaN, Number.NaN)).toEqual({ page: 1, limit: 12, offset: 0 });
  });

  it('computes offset from page and limit', () => {
    expect(getPagination(3, 10)).toEqual({ page: 3, limit: 10, offset: 20 });
  });
});
