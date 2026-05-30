/**
 * normalize-word.ts
 * Turkish-aware word normalization.
 * Handles the Turkish locale quirks: i→ı, I→İ in lowercase operations.
 */

/** Turkish special characters (lowercase) */
const TURKISH_LOWER = new Set(['ç', 'ğ', 'ı', 'ö', 'ş', 'ü', 'i']);
/** All valid Turkish word characters (lowercase) */
const VALID_TR_CHARS = /^[a-zçğıöşüâîû]+$/;

/**
 * Turkish-aware lowercase.
 * Standard JS toLowerCase() incorrectly maps 'İ' → 'i̇' and 'I' → 'i'.
 * In Turkish: 'İ' → 'i', 'I' → 'ı'.
 */
export function turkishToLower(str: string): string {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

/**
 * Normalize a word for storage and comparison.
 * - Trim whitespace
 * - Turkish lowercase
 * - Validate only Turkish letters
 * Returns null if the word is invalid.
 */
export function normalizeWord(word: string): string | null {
  const trimmed = word.trim();
  if (!trimmed) return null;

  const lower = turkishToLower(trimmed);

  if (!VALID_TR_CHARS.test(lower)) return null;
  if (lower.length < 2) return null;

  return lower;
}

/**
 * Check if a word contains any Turkish-specific characters.
 */
export function hasTurkishChars(word: string): boolean {
  return [...word].some((ch) => TURKISH_LOWER.has(ch));
}

/**
 * Normalize for answer comparison — same as normalizeWord.
 */
export function normalizeAnswer(raw: string): string | null {
  return normalizeWord(raw);
}
