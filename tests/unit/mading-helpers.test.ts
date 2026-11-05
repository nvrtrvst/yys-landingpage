import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ default: { execute: vi.fn() } }));
vi.mock('isomorphic-dompurify', () => ({
  default: { sanitize: (value: string) => value },
}));

import { slugifyTitle, canAccessUnit, isModerator } from '@/lib/mading';

describe('slugifyTitle', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyTitle('Halo Dunia')).toBe('halo-dunia');
  });

  it('strips diacritics', () => {
    expect(slugifyTitle('Café Bar')).toBe('cafe-bar');
  });

  it('falls back to "post" for empty input', () => {
    expect(slugifyTitle('')).toBe('post');
  });

  it('trims surrounding separators', () => {
    expect(slugifyTitle('  --Hello--  ')).toBe('hello');
  });

  it('caps the slug at 80 characters', () => {
    expect(slugifyTitle('a'.repeat(200))).toHaveLength(80);
  });
});

describe('canAccessUnit', () => {
  it('grants admins access to any unit', () => {
    expect(canAccessUnit('superadmin', null, 5)).toBe(true);
    expect(canAccessUnit('admin', null, 5)).toBe(true);
  });

  it('limits other roles to their own unit', () => {
    expect(canAccessUnit('guru', 5, 5)).toBe(true);
    expect(canAccessUnit('guru', 5, 6)).toBe(false);
  });
});

describe('isModerator', () => {
  it('recognizes moderator roles', () => {
    expect(isModerator('guru')).toBe(true);
    expect(isModerator('admin_unit')).toBe(true);
  });

  it('rejects non-moderator roles', () => {
    expect(isModerator('siswa')).toBe(false);
  });
});
