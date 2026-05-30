/**
 * scoring.ts
 * Pure backend scoring functions.
 * All inputs must come from server timestamps.
 */

import type { ScoreResult } from '../types';

/** Scoring multiplier constants */
const SPEED_MULTIPLIER = 2;    // points per remaining second
const COMBO_MULTIPLIER = 5;    // bonus per consecutive correct answer

/**
 * Calculate the score for a submitted answer.
 *
 * @param wordLength      Length of the target word
 * @param isCorrect       Whether the submitted answer is correct
 * @param responseTimeMs  Time from round start to submission (server-calculated)
 * @param roundDurationMs Total duration of the round in ms
 * @param comboCount      Number of consecutive correct answers BEFORE this one
 */
export function calculateScore(
  wordLength: number,
  isCorrect: boolean,
  responseTimeMs: number,
  roundDurationMs: number,
  comboCount: number
): ScoreResult {
  if (!isCorrect) {
    return {
      isCorrect: false,
      baseScore: 0,
      speedBonus: 0,
      comboBonus: 0,
      scoreAwarded: 0,
      responseTimeMs,
    };
  }

  const baseScore = wordLength * 10;

  const remainingMs = Math.max(0, roundDurationMs - responseTimeMs);
  const remainingSeconds = remainingMs / 1000;
  const speedBonus = Math.round(remainingSeconds * SPEED_MULTIPLIER);

  const comboBonus = comboCount * COMBO_MULTIPLIER;

  const scoreAwarded = baseScore + speedBonus + comboBonus;

  return {
    isCorrect: true,
    baseScore,
    speedBonus,
    comboBonus,
    scoreAwarded,
    responseTimeMs,
  };
}

/**
 * Determine new combo count after an answer.
 */
export function nextComboCount(wasCorrect: boolean, currentCombo: number): number {
  return wasCorrect ? currentCombo + 1 : 0;
}
