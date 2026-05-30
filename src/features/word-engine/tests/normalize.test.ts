import { describe, it, expect } from 'vitest';
import { normalizeWord, turkishToLower, hasTurkishChars, normalizeAnswer } from '../core/normalize-word';

describe('normalizeWord', () => {
  it('trims whitespace', () => {
    expect(normalizeWord('  kalem  ')).toBe('kalem');
  });

  it('lowercases ASCII letters', () => {
    expect(normalizeWord('KALEM')).toBe('kalem');
  });

  it('handles Turkish İ → i correctly', () => {
    expect(normalizeWord('İstanbul')).toBe('istanbul');
  });

  it('handles Turkish I → ı correctly', () => {
    expect(turkishToLower('ILIK')).toBe('ılık');
  });

  it('preserves Turkish characters', () => {
    expect(normalizeWord('çiçek')).toBe('çiçek');
    expect(normalizeWord('güneş')).toBe('güneş');
    expect(normalizeWord('köpek')).toBe('köpek');
  });

  it('rejects empty string', () => {
    expect(normalizeWord('')).toBeNull();
    expect(normalizeWord('   ')).toBeNull();
  });

  it('rejects single character', () => {
    expect(normalizeWord('a')).toBeNull();
  });

  it('rejects numbers', () => {
    expect(normalizeWord('kel3m')).toBeNull();
  });

  it('rejects special chars', () => {
    expect(normalizeWord('kel!m')).toBeNull();
  });

  it('normalizeAnswer is same as normalizeWord', () => {
    expect(normalizeAnswer('Kalem')).toBe('kalem');
  });
});

describe('hasTurkishChars', () => {
  it('returns true for Turkish chars', () => {
    expect(hasTurkishChars('çiçek')).toBe(true);
    expect(hasTurkishChars('güneş')).toBe(true);
  });

  it('returns false for pure ASCII', () => {
    expect(hasTurkishChars('kalem')).toBe(false);
    expect(hasTurkishChars('masa')).toBe(false);
  });
});
