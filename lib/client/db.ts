/**
 * Database Client (Infrastructure Layer)
 *
 * Responsibilities:
 * - Initialize Dexie (IndexedDB wrapper)
 * - Define schema and migrations
 * - Export database instance
 * - NO business logic
 *
 * This is the ONLY place where Dexie schema is defined.
 */

import Dexie, { type EntityTable } from "dexie";

export interface Note {
  id: string; // UUIDv7 (new) or timestamp (legacy, e.g., "1700000000001")
  content: string; // Pure markdown content (frontmatter stripped)
  tags: string[]; // Parsed from frontmatter or #hashtags
  date: number; // Unix timestamp (legacy field, kept for backward compatibility)
  createdAt: number; // Unix timestamp when note was created
  updatedAt: number; // Unix timestamp when note was last modified
  sha?: string; // Git blob SHA for sync diffing (undefined for new notes)
  syncStatus: "synced" | "modified" | "pending" | "syncing" | "error";
  errorMessage?: string; // Error details if syncStatus === 'error'
  deleted?: boolean; // true: deleted (in trash), false/undefined: active
  deletedAt?: number; // Unix timestamp when note was moved to trash
  title?: string; // Extracted from the first line if it starts with #
  isTemplate?: boolean; // true: this note is a template (Pro feature)
}

export const db = new Dexie("marlin_db") as Dexie & {
  notes: EntityTable<Note, "id">;
};

// Version 1-8: Legacy schema history (omitted for brevity in new structure, but technically still registered in Dexie internally)
// We jump straight to a clean schema for the new architecture, but to support existing clients upgrading,
// we would typically chain versions. However, since the user authorized a "fresh start" approach for the refactor,
// and to keep this file clean, I'll define the latest schema.

// If we wanted to keep history we would list them. For this refactor, let's define the comprehensive current state
// as version 10 to ensure it overrides any previous local state if the DB name is the same.

db.version(10).stores({
  notes: "id, sha, content, *tags, date, syncStatus, deleted, deletedAt, title, isTemplate, createdAt, updatedAt",
});

/**
 * Check if there are any unsynced changes in the database
 *
 * @returns true if any notes have status other than 'synced'
 */
export async function hasUnsyncedChanges(): Promise<boolean> {
  const unsyncedCount = await db.notes
    .where("syncStatus")
    .anyOf(["pending", "modified", "syncing", "error"])
    .count();

  // Also check for pending deletions (tombstones)
  const pendingDeletions = await db.notes
    .filter((n) => n.deleted === true && n.syncStatus !== "synced")
    .count();

  return unsyncedCount > 0 || pendingDeletions > 0;
}
