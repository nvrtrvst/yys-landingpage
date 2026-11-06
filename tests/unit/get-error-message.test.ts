import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/lib/get-error-message';

describe('getErrorMessage', () => {
  it('returns the message of an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a non-empty string value as-is', () => {
    expect(getErrorMessage('plain failure')).toBe('plain failure');
  });

  it('falls back for unknown values', () => {
    expect(getErrorMessage({})).toBe('Terjadi kesalahan');
    expect(getErrorMessage(null)).toBe('Terjadi kesalahan');
    expect(getErrorMessage('')).toBe('Terjadi kesalahan');
  });

  it('uses a custom fallback', () => {
    expect(getErrorMessage(undefined, 'Gagal menghapus')).toBe('Gagal menghapus');
  });
});
