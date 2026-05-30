import { describe, it, expect } from 'vitest';
import { scrambleWord, mergeAndShuffle } from '../core/scramble-word';

describe('scrambleWord', () => {
  it('preserves all original letters', () => {
    const word = 'kalem';
    const letters = [...word];
    const scrambled = scrambleWord(word);
    expect(scrambled.sort()).toEqual(letters.sort());
  });

  it('preserves Turkish characters', () => {
    const word = 'çiçek';
    const letters = [...word];
    const scrambled = scrambleWord(word);
    expect(scrambled.sort()).toEqual(letters.sort());
  });

  it('produces a different order (usually) for longer words', () => {
    // Run 10 times — extremely unlikely to be same order each time for 7+ letter word
    const word = 'bilgisayar';
    let allSame = true;
    for (let i = 0; i < 10; i++) {
      if (scrambleWord(word).join('') !== word) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(false);
  });

  it('handles single character gracefully', () => {
    expect(scrambleWord('a')).toEqual(['a']);
  });

  it('handles two characters', () => {
    const result = scrambleWord('ab');
    expect(result.sort()).toEqual(['a', 'b']);
  });
});

describe('mergeAndShuffle', () => {
  it('contains all word and distractor letters', () => {
    const wordLetters = ['k', 'a', 'l', 'e', 'm'];
    const distractors = ['r', 'n'];
    const merged = mergeAndShuffle(wordLetters, distractors);
    expect(merged).toHaveLength(7);
    expect(merged.sort()).toEqual([...wordLetters, ...distractors].sort());
  });

  it('handles empty distractors', () => {
    const wordLetters = ['k', 'a', 'l'];
    const merged = mergeAndShuffle(wordLetters, []);
    expect(merged).toHaveLength(3);
  });
});
