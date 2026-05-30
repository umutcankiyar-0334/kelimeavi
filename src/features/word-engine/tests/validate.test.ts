import { describe, it, expect, beforeEach } from 'vitest';
import { initValidator, isValidWord, isCorrectAnswer } from '../core/validate-word';
import type { WordEntry } from '../types';

const testWords: WordEntry[] = [
  { word: 'kalem', length: 5, difficulty: 'easy', frequency: 900, hasTurkishChars: false },
  { word: 'masa', length: 4, difficulty: 'easy', frequency: 950, hasTurkishChars: false },
  { word: 'güneş', length: 5, difficulty: 'easy', frequency: 880, hasTurkishChars: true },
];

describe('isValidWord', () => {
  beforeEach(() => {
    initValidator(testWords);
  });

  it('returns true for valid words', () => {
    expect(isValidWord('kalem')).toBe(true);
    expect(isValidWord('masa')).toBe(true);
    expect(isValidWord('güneş')).toBe(true);
  });

  it('returns false for unknown words', () => {
    expect(isValidWord('xyz123')).toBe(false);
    expect(isValidWord('araba')).toBe(false); // not in test set
  });

  it('is case-sensitive (expects pre-normalized input)', () => {
    expect(isValidWord('Kalem')).toBe(false);
    expect(isValidWord('MASA')).toBe(false);
  });
});

describe('isCorrectAnswer', () => {
  it('returns true when submitted matches original', () => {
    expect(isCorrectAnswer('kalem', 'kalem')).toBe(true);
  });

  it('returns false when submitted does not match', () => {
    expect(isCorrectAnswer('kalme', 'kalem')).toBe(false);
    expect(isCorrectAnswer('masa', 'kalem')).toBe(false);
  });

  it('is exact match — no partial credit', () => {
    expect(isCorrectAnswer('kale', 'kalem')).toBe(false);
  });
});
