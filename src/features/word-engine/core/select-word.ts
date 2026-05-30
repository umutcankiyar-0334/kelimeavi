/**
 * select-word.ts
 * Difficulty-aware word selection from the dictionary.
 */

import type { WordEntry, DifficultyLevel, RoundConfig } from '../types';

/** Difficulty progression config */
interface DifficultyConfig {
  difficulty: DifficultyLevel;
  minLength: number;
  maxLength: number;
  minFrequency: number;
}

/**
 * Get difficulty configuration for a given round.
 */
export function getRoundDifficultyConfig(config: RoundConfig): DifficultyConfig {
  const { roundNumber, totalRounds } = config;
  const progress = roundNumber / totalRounds;

  if (progress <= 0.25) {
    // Rounds 1-2 (of 8): Easy
    return { difficulty: 'easy', minLength: 4, maxLength: 6, minFrequency: 900 };
  } else if (progress <= 0.625) {
    // Rounds 3-5 (of 8): Medium
    return { difficulty: 'medium', minLength: 5, maxLength: 7, minFrequency: 800 };
  } else {
    // Rounds 6-8 (of 8): Hard
    return { difficulty: 'hard', minLength: 6, maxLength: 9, minFrequency: 500 };
  }
}

/**
 * Filter words that match the difficulty config.
 */
function filterWords(words: WordEntry[], config: DifficultyConfig): WordEntry[] {
  return words.filter(
    (w) =>
      w.difficulty === config.difficulty &&
      w.length >= config.minLength &&
      w.length <= config.maxLength &&
      w.frequency >= config.minFrequency
  );
}

/**
 * Select a word for the current round.
 * Falls back to less strict filtering if no words match.
 * Never returns undefined — always returns a valid word.
 */
export function selectWord(
  words: WordEntry[],
  roundConfig: RoundConfig,
  excludeWords: string[] = []
): WordEntry {
  const config = getRoundDifficultyConfig(roundConfig);
  const excluded = new Set(excludeWords);

  // Strict filter
  let candidates = filterWords(words, config).filter(
    (w) => !excluded.has(w.word)
  );

  // Fallback 1: Same difficulty, relax length/frequency constraints
  if (candidates.length === 0) {
    candidates = words
      .filter((w) => w.difficulty === config.difficulty && !excluded.has(w.word));
  }

  // Fallback 2: Any word not excluded
  if (candidates.length === 0) {
    candidates = words.filter((w) => !excluded.has(w.word));
  }

  // Fallback 3: Any word (repeat is allowed in extreme edge cases)
  if (candidates.length === 0) {
    candidates = words;
  }

  // Weighted random selection: higher frequency = more likely
  const totalWeight = candidates.reduce((sum, w) => sum + w.frequency, 0);
  let rand = Math.random() * totalWeight;

  for (const word of candidates) {
    rand -= word.frequency;
    if (rand <= 0) return word;
  }

  return candidates[candidates.length - 1];
}
