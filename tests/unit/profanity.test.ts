import { describe, it, expect } from 'vitest';
import { containsProfanity, getProfanityWords } from '@/lib/profanity';

describe('containsProfanity', () => {
  it('detects plain bad words', () => {
    expect(containsProfanity('dasar tolol')).toBe(true);
    expect(containsProfanity('anjing')).toBe(true);
  });

  it('detects simple obfuscation', () => {
    expect(containsProfanity('t0l0l')).toBe(true);
    expect(containsProfanity('t o l o l')).toBe(true);
    expect(containsProfanity('t.o.l.o.l')).toBe(true);
  });

  it('returns false for clean text and empty input', () => {
    expect(containsProfanity('selamat pagi semua')).toBe(false);
    expect(containsProfanity('')).toBe(false);
  });

  it('documents false positives caused by short common words', () => {
    expect(containsProfanity('the quick brown fox')).toBe(true);
  });
});

describe('getProfanityWords', () => {
  it('returns a copy so callers cannot mutate the list', () => {
    const words = getProfanityWords();
    words.push('added');
    expect(getProfanityWords()).not.toContain('added');
  });
});
