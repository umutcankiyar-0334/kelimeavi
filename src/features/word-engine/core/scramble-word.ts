/**
 * scramble-word.ts
 * Fisher-Yates shuffle ensuring result is always different from original.
 */

/**
 * Fisher-Yates in-place shuffle.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Scramble the letters of a word.
 * Guarantees that the result differs from the original (max 10 attempts).
 * For very short words (≤2 chars) or all-same-char words, best effort.
 */
export function scrambleWord(word: string): string[] {
  const letters = [...word];

  // Single char — nothing to scramble
  if (letters.length <= 1) return letters;

  let scrambled = shuffle(letters);
  let attempts = 0;

  while (scrambled.join('') === word && attempts < 10) {
    scrambled = shuffle(letters);
    attempts++;
  }

  return scrambled;
}

/**
 * Given scrambled word letters and distractor letters, merge and shuffle.
 */
export function mergeAndShuffle(
  wordLetters: string[],
  distractorLetters: string[]
): string[] {
  return shuffle([...wordLetters, ...distractorLetters]);
}
