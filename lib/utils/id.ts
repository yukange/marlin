/**
 * ID Generation Utilities (Utility Layer)
 *
 * Responsibilities:
 * - Generate unique IDs for notes
 * - Pure functions with no side effects
 */

/**
 * Generate a unique note ID based on current timestamp
 *
 * This is the ONLY way to generate note IDs in Marlin.
 * Format: Unix timestamp as string (e.g., "1700000000001")
 *
 * @returns Note ID (timestamp string)
 */
export function generateNoteId(): string {
  return String(Date.now());
}

/**
 * Validate note ID format
 *
 * Valid format: Numeric string representing a Unix timestamp
 *
 * @param id - ID to validate
 * @returns true if ID is valid
 */
export function isValidNoteId(id: string): boolean {
  // Must be numeric and represent a reasonable timestamp
  const timestamp = Number(id);
  return (
    !isNaN(timestamp) &&
    timestamp > 1000000000000 && // After 2001
    timestamp < 9999999999999 // Before year 2286
  );
}

/**
 * Parse note ID to timestamp
 *
 * @param id - Note ID
 * @returns Unix timestamp or null if invalid
 */
export function parseNoteId(id: string): number | null {
  if (!isValidNoteId(id)) {
    return null;
  }
  return Number(id);
}
