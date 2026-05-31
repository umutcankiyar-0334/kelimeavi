/**
 * scoring.ts  (v2)
 * 
 * New rules:
 * - Everyone who answers CORRECTLY gets points (no "first one wins" monopoly).
 * - Base score  = word.length × 10
 * - Speed bonus = remainingSeconds × 3   (faster → more)
 * - Letter bonus = uniqueTurkishChars × 5  (harder Turkish chars → reward)
 * - Combo bonus  = comboCount × 8
 * - Wrong answer = −(word.length × 5)   (small penalty, keeps game honest)
 * - No answer    = 0 (no penalty for disconnected/AFK)
 */

import type { ScoreResult } from '../types';

const SPEED_MULTIPLIER  = 3;
const COMBO_MULTIPLIER  = 8;
const TURKISH_BONUS     = 5;   // per unique Turkish char in the word
const WRONG_PENALTY_PER_CHAR = 5;

const TURKISH_SPECIAL = new Set(['ç','ğ','ı','ö','ş','ü','â','î','û']);

function countUniqueTurkishChars(word: string): number {
  const seen = new Set<string>();
  for (const ch of word) {
    if (TURKISH_SPECIAL.has(ch)) seen.add(ch);
  }
  return seen.size;
}

export function calculateScore(
  word: string,
  isCorrect: boolean,
  didSubmit: boolean,
  responseTimeMs: number,
  roundDurationMs: number,
  comboCount: number
): ScoreResult {
  const wordLength = word.length;

  // No submission → 0 (AFK / disconnected, no penalty)
  if (!didSubmit) {
    return {
      isCorrect: false,
      baseScore: 0,
      speedBonus: 0,
      comboBonus: 0,
      letterBonus: 0,
      scoreAwarded: 0,
      responseTimeMs,
    };
  }

  // Wrong answer → small penalty
  if (!isCorrect) {
    const penalty = -(wordLength * WRONG_PENALTY_PER_CHAR);
    return {
      isCorrect: false,
      baseScore: penalty,
      speedBonus: 0,
      comboBonus: 0,
      letterBonus: 0,
      scoreAwarded: penalty,
      responseTimeMs,
    };
  }

  // Correct answer
  const baseScore   = wordLength * 10;
  const remainingMs = Math.max(0, roundDurationMs - responseTimeMs);
  const speedBonus  = Math.round((remainingMs / 1000) * SPEED_MULTIPLIER);
  const letterBonus = countUniqueTurkishChars(word) * TURKISH_BONUS;
  const comboBonus  = comboCount * COMBO_MULTIPLIER;
  const scoreAwarded = baseScore + speedBonus + letterBonus + comboBonus;

  return {
    isCorrect: true,
    baseScore,
    speedBonus,
    comboBonus,
    letterBonus,
    scoreAwarded,
    responseTimeMs,
  };
}

export function nextComboCount(wasCorrect: boolean, current: number): number {
  return wasCorrect ? current + 1 : 0;
}
