export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface WordEntry {
  word: string;
  length: number;
  difficulty: DifficultyLevel;
  frequency: number; // 1-1000, higher = more common
  hasTurkishChars: boolean;
}

export interface RoundConfig {
  roundNumber: number;
  totalRounds: number;
  durationSeconds: number;
  resultDurationSeconds: number;
}

export interface SelectedRoundWord {
  originalWord: string;
  scrambledLetters: string[];
  distractorLetters: string[];
  difficulty: DifficultyLevel;
  allLetters: string[]; // scrambled + distractors shuffled together
}

export interface ScoreResult {
  isCorrect: boolean;
  baseScore: number;
  speedBonus: number;
  comboBonus: number;
  letterBonus: number;
  scoreAwarded: number;
  responseTimeMs: number;
}

export interface AnswerValidationInput {
  submittedWord: string;
  originalWord: string;
  roundStatus: 'pending' | 'active' | 'finished';
  roundEndsAt: Date;
  serverNow: Date;
}
