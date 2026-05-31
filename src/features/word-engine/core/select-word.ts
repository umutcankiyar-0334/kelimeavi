/**
 * select-word.ts
 * Difficulty-aware word selection from the dictionary or seed words.
 */

import type { WordEntry, DifficultyLevel, RoundConfig } from '../types';
import trWords from '../data/tr-words';
import { trDictionaryWords, DictionaryWordEntry } from '../data/tr-dictionary-words';

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
 */
export function selectWord(
  roundConfig: RoundConfig,
  excludeWords: string[] = [],
  gameMode: 'seed_words' | 'dictionary' = 'seed_words'
): { word: string; difficulty: DifficultyLevel; clue?: string } {
  const config = getRoundDifficultyConfig(roundConfig);
  const excluded = new Set(excludeWords);

  if (gameMode === 'dictionary') {
    // Select from dictionary entries
    const filterDict = (w: DictionaryWordEntry) => w.difficulty === config.difficulty;
    let candidates = trDictionaryWords.filter((w) => filterDict(w) && !excluded.has(w.word));
    if (candidates.length === 0) candidates = trDictionaryWords.filter((w) => w.difficulty === config.difficulty && !excluded.has(w.word));
    if (candidates.length === 0) candidates = trDictionaryWords.filter((w) => !excluded.has(w.word));
    if (candidates.length === 0) candidates = trDictionaryWords;

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return { word: selected.word, difficulty: selected.difficulty, clue: selected.clue };
  } else {
    // Select from seed words
    let candidates = filterWords(trWords, config).filter(
      (w) => !excluded.has(w.word)
    );

    // Fallback 1: Same difficulty, relax constraints
    if (candidates.length === 0) {
      candidates = trWords.filter((w) => w.difficulty === config.difficulty && !excluded.has(w.word));
    }

    // Fallback 2: Any word not excluded
    if (candidates.length === 0) {
      candidates = trWords.filter((w) => !excluded.has(w.word));
    }

    // Fallback 3: Any word
    if (candidates.length === 0) {
      candidates = trWords;
    }

    // Weighted random selection
    const totalWeight = candidates.reduce((sum, w) => sum + w.frequency, 0);
    let rand = Math.random() * totalWeight;
    let chosen = candidates[candidates.length - 1];
    for (const word of candidates) {
      rand -= word.frequency;
      if (rand <= 0) {
        chosen = word;
        break;
      }
    }

    return { word: chosen.word, difficulty: chosen.difficulty };
  }
}
