/**
 * distractor.ts
 * Generates distractor letters to add to scrambled words.
 * Letters are chosen to look plausible but make the puzzle harder.
 */

import type { DifficultyLevel } from '../types';

/** Common Turkish consonants and vowels that look "natural" as distractors */
const COMMON_VOWELS = ['a', 'e', 'i', 'o', 'u', 'ı', 'ö', 'ü'];
const COMMON_CONSONANTS = ['r', 'n', 's', 'l', 'k', 't', 'm', 'b', 'y', 'd', 'ç', 'ş'];

/**
 * How many distractor letters to add based on round progression.
 */
export function getDistractorCount(
  roundNumber: number,
  totalRounds: number,
  difficulty: DifficultyLevel
): number {
  // Override by explicit difficulty
  if (difficulty === 'hard') {
    return roundNumber >= Math.floor(totalRounds * 0.6) ? 2 : 1;
  }
  if (difficulty === 'easy') {
    return 0;
  }

  // Medium: scale by round
  const progress = roundNumber / totalRounds;
  if (progress < 0.4) return 0;
  if (progress < 0.75) return 1;
  return 1;
}

/**
 * Generate distractor letters that are NOT already in the word.
 * Picks a mix of vowels and consonants.
 */
export function generateDistractors(
  wordLetters: string[],
  count: number
): string[] {
  if (count <= 0) return [];

  const wordSet = new Set(wordLetters);
  const candidates: string[] = [];

  // Build candidate pool excluding letters already in the word
  for (const ch of [...COMMON_VOWELS, ...COMMON_CONSONANTS]) {
    if (!wordSet.has(ch)) {
      candidates.push(ch);
    }
  }

  // Shuffle candidates and take first `count`
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
