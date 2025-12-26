/**
 * Global Constants
 *
 * Application-wide configuration and constants.
 * Keep this file minimal and focused on true constants.
 */

/**
 * Reserved keywords that cannot be used as space names
 *
 * These prevent routing conflicts with Next.js app routes.
 */
export const RESERVED_KEYWORDS = [
  "api",
  "auth",
  "login",
  "new",
  "settings",
  "static",
  "pro",
  "privacy",
  "terms",
  "app",
  "debug",
  "_next",
] as const;

/**
 * Sync configuration
 */
export const SYNC_CONFIG = {
  /** Batch size for parallel blob downloads during full sync */
  BATCH_SIZE: 5,

  /** Maximum retries for failed sync operations */
  MAX_RETRIES: 3,

  /** Timeout for sync operations (milliseconds) */
  TIMEOUT: 30000,
} as const;

/**
 * Space configuration
 */
export const SPACE_CONFIG = {
  /** Maximum length for space names (GitHub limit is 100, reserve 7 for ".marlin") */
  MAX_NAME_LENGTH: 93,

  /** Repository suffix for Marlin spaces */
  REPO_SUFFIX: ".marlin",
} as const;

/**
 * Note configuration
 */
export const NOTE_CONFIG = {
  /** Folder path in repository where notes are stored */
  NOTES_FOLDER: "notes",

  /** File extension for note files */
  FILE_EXTENSION: ".md",

  /** Default tag added to conflicted notes */
  CONFLICT_TAG: "conflict",
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  /** Minimum touch target size for mobile (pixels) */
  MIN_TOUCH_TARGET: 44,

  /** Toast display duration (milliseconds) */
  TOAST_DURATION: 3000,
} as const;
