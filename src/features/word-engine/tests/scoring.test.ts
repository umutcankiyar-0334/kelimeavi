import { describe, it, expect } from 'vitest';
import { calculateScore, nextComboCount } from '../core/scoring';

describe('calculateScore', () => {
  const ROUND_DURATION_MS = 30_000;

  it('returns zero score for wrong answer when didSubmit is false', () => {
    // AFK / No submission -> 0 points (no penalty)
    const result = calculateScore('kalem', false, false, ROUND_DURATION_MS, ROUND_DURATION_MS, 0);
    expect(result.isCorrect).toBe(false);
    expect(result.scoreAwarded).toBe(0);
    expect(result.baseScore).toBe(0);
    expect(result.speedBonus).toBe(0);
    expect(result.comboBonus).toBe(0);
  });

  it('returns negative penalty for wrong answer when didSubmit is true', () => {
    // Wrong answer submitted -> -25 penalty (5 letters * 5 penalty per char)
    const result = calculateScore('kalem', false, true, 10_000, ROUND_DURATION_MS, 0);
    expect(result.isCorrect).toBe(false);
    expect(result.scoreAwarded).toBe(-25);
    expect(result.baseScore).toBe(-25);
  });

  it('calculates base score as wordLength * 10', () => {
    // Correct immediately, 0 combo, no Turkish chars
    const result = calculateScore('kalem', true, true, 0, ROUND_DURATION_MS, 0);
    expect(result.baseScore).toBe(50);
  });

  it('calculates speed bonus correctly', () => {
    // Answered immediately (0ms), 30s remaining -> 30 * 3 = 90 speed bonus
    const result = calculateScore('kalem', true, true, 0, ROUND_DURATION_MS, 0);
    expect(result.speedBonus).toBe(90);
  });

  it('speed bonus is 0 when answered at last moment', () => {
    const result = calculateScore('kalem', true, true, ROUND_DURATION_MS, ROUND_DURATION_MS, 0);
    expect(result.speedBonus).toBe(0);
  });

  it('speed bonus never goes negative', () => {
    // Answer submitted AFTER round end (edge case)
    const result = calculateScore('kalem', true, true, 40_000, ROUND_DURATION_MS, 0);
    expect(result.speedBonus).toBeGreaterThanOrEqual(0);
  });

  it('calculates combo bonus as comboCount * 8', () => {
    const result = calculateScore('kalem', true, true, ROUND_DURATION_MS, ROUND_DURATION_MS, 3);
    expect(result.comboBonus).toBe(24);
  });

  it('final score = base + speed + combo + letterBonus', () => {
    // word: 'çiçek' -> length: 5 (base = 50), 2 unique Turkish chars ('ç', 'i' -> wait, 'ç' and 'ç' is same, unique is 'ç', 'i' is NOT special in lowercase unless in TURKISH_SPECIAL. In scoring, TURKISH_SPECIAL is ['ç','ğ','ı','ö','ş','ü','â','î','û']. 'çiçek' has 'ç' which is special. So letterBonus = 1 * 5 = 5)
    // responseTimeMs = 15_000 (15s remaining * 3 = 45 speedBonus)
    // comboCount = 2 (2 * 8 = 16 comboBonus)
    // total = 50 + 45 + 16 + 5 = 116
    const result = calculateScore('çiçek', true, true, 15_000, ROUND_DURATION_MS, 2);
    expect(result.baseScore).toBe(50);
    expect(result.speedBonus).toBe(45);
    expect(result.comboBonus).toBe(16);
    expect(result.letterBonus).toBe(5);
    expect(result.scoreAwarded).toBe(116);
  });

  it('stores responseTimeMs', () => {
    const result = calculateScore('kalem', true, true, 12_500, ROUND_DURATION_MS, 0);
    expect(result.responseTimeMs).toBe(12_500);
  });
});

describe('nextComboCount', () => {
  it('increments combo on correct answer', () => {
    expect(nextComboCount(true, 0)).toBe(1);
    expect(nextComboCount(true, 3)).toBe(4);
  });

  it('resets combo on wrong answer', () => {
    expect(nextComboCount(false, 5)).toBe(0);
    expect(nextComboCount(false, 0)).toBe(0);
  });
});
