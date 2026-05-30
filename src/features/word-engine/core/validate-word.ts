/**
 * validate-word.ts
 * O(1) Set-based word validation using the preloaded dictionary.
 */

import type { WordEntry } from '../types';

let _wordSet: Set<string> | null = null;
let _wordMap: Map<string, WordEntry> | null = null;

/**
 * Initialize the validator with the dictionary.
 * Call once at startup (server-side) or lazy-init on first call.
 */
export function initValidator(words: WordEntry[]): void {
  _wordSet = new Set(words.map((w) => w.word));
  _wordMap = new Map(words.map((w) => [w.word, w]));
}

function ensureInit(): void {
  if (!_wordSet) {
    throw new Error(
      'WordValidator not initialized. Call initValidator(words) first.'
    );
  }
}

/**
 * Check if a normalized word exists in the dictionary.
 * O(1) lookup.
 */
export function isValidWord(normalizedWord: string): boolean {
  ensureInit();
  return _wordSet!.has(normalizedWord);
}

/**
 * Get full WordEntry for a word.
 */
export function getWordEntry(normalizedWord: string): WordEntry | undefined {
  ensureInit();
  return _wordMap?.get(normalizedWord);
}

/**
 * Check if submitted answer matches the original word exactly (normalized).
 */
export function isCorrectAnswer(
  submittedNormalized: string,
  originalNormalized: string
): boolean {
  return submittedNormalized === originalNormalized;
}
