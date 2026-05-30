import { describe, it, expect } from 'vitest';
import { calculateScore, nextComboCount } from '../core/scoring';

describe('calculateScore', () => {
  const ROUND_DURATION_MS = 30_000;

  it('returns zero score for wrong answer', () => {
    const result = calculateScore(5, false, 10_000, ROUND_DURATION_MS, 0);
    expect(result.isCorrect).toBe(false);
    expect(result.scoreAwarded).toBe(0);
    expect(result.baseScore).toBe(0);
    expect(result.speedBonus).toBe(0);
    expect(result.comboBonus).toBe(0);
  });

  it('calculates base score as wordLength * 10', () => {
    const result = calculateScore(5, true, 0, ROUND_DURATION_MS, 0);
    expect(result.baseScore).toBe(50);
  });

  it('calculates speed bonus correctly', () => {
    // Answered immediately (0ms), 30s remaining → 30 * 2 = 60 speed bonus
    const result = calculateScore(5, true, 0, ROUND_DURATION_MS, 0);
    expect(result.speedBonus).toBe(60);
  });

  it('speed bonus is 0 when answered at last moment', () => {
    const result = calculateScore(5, true, ROUND_DURATION_MS, ROUND_DURATION_MS, 0);
    expect(result.speedBonus).toBe(0);
  });

  it('speed bonus never goes negative', () => {
    // Answer submitted AFTER round end (edge case)
    const result = calculateScore(5, true, 40_000, ROUND_DURATION_MS, 0);
    expect(result.speedBonus).toBeGreaterThanOrEqual(0);
  });

  it('calculates combo bonus as comboCount * 5', () => {
    const result = calculateScore(5, true, 0, ROUND_DURATION_MS, 3);
    expect(result.comboBonus).toBe(15);
  });

  it('final score = base + speed + combo', () => {
    const result = calculateScore(5, true, 15_000, ROUND_DURATION_MS, 2);
    // base: 50, speed: (15s remaining * 2) = 30, combo: 2*5 = 10
    expect(result.baseScore).toBe(50);
    expect(result.speedBonus).toBe(30);
    expect(result.comboBonus).toBe(10);
    expect(result.scoreAwarded).toBe(90);
  });

  it('stores responseTimeMs', () => {
    const result = calculateScore(5, true, 12_500, ROUND_DURATION_MS, 0);
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
