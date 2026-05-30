/**
 * Word engine index — re-exports all public APIs.
 * Use this as the single import point for the word engine.
 */

export * from './core/normalize-word';
export * from './core/scramble-word';
export * from './core/select-word';
export * from './core/distractor';
export * from './core/validate-word';
export * from './core/scoring';
export * from './types';
export { default as trWords } from './data/tr-words';
