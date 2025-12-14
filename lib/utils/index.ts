/**
 * Utils Layer Exports
 * 
 * Re-export utility functions for convenience.
 * Pure functions with no side effects.
 */

// Markdown Utils
export {
  parseNote,
  stringifyNote,
  extractHashtags,
  mergeTags,
} from './markdown';
export type { ParsedNote } from './markdown';

// Date Utils
export {
  formatDate,
  formatRelativeTime,
  toISODate,
  getStartOfDay,
  getEndOfDay,
  isSameDay,
} from './date';

// ID Utils
export {
  generateNoteId,
  isValidNoteId,
  parseNoteId,
} from './id';
