/**
 * Note Service (Business Layer - Local-First)
 *
 * Responsibilities:
 * - Create, update, delete notes (optimistic updates)
 * - Generate note IDs (UUIDv7)
 * - Coordinate with sync engine (fast path)
 * - Query notes from local database
 *
 * Depends on:
 * - lib/client/db.ts
 * - lib/services/sync-service.ts (for fast sync)
 */

import { uuidv7 } from "uuidv7";

import { db, type Note } from "@/lib/client/db";
import { extractTitle, extractHashtags } from "@/lib/utils/markdown";
import { isErrorWithStatus, isGitHubFile } from "@/lib/utils/type-guards";

export interface CreateNoteInput {
  content: string;
  space: string; // Space name without .marlin suffix (e.g., "work")
  userLogin: string;
}

export interface UpdateNoteInput {
  id: string;
  space: string; // Space name without .marlin suffix (e.g., "work")
  content: string;
  userLogin: string;
}

/**
 * Create a new note
 *
 * Flow:
 * 1. Generate UUIDv7 ID
 * 2. Write to Dexie with status 'pending'
 * 3. Trigger fast sync (push single note)
 * 4. Return note ID for UI reference
 *
 * @returns Note ID (UUIDv7 string)
 */
export async function createNote(input: CreateNoteInput): Promise<string> {
  const { content, space, userLogin } = input;

  // Generate UUIDv7 ID (time-ordered, globally unique)
  const id = uuidv7();
  const now = Date.now();

  // Extract title if present
  const title = extractTitle(content);

  // Extract hashtags from content
  const tags = extractHashtags(content);
  console.log("[createNote] Content:", content);
  console.log("[createNote] Extracted tags:", tags);

  // Write to local database (critical path)
  await db.notes.add({
    id,
    content,
    tags,
    date: now, // Legacy field for backward compatibility
    createdAt: now,
    updatedAt: now,
    space,
    syncStatus: "pending",
    sha: undefined,
    title,
  });

  // Trigger background sync (fire and forget)
  // Import dynamically to avoid circular dependency
  const { pushSingleNote } = await import("@/lib/services/sync-service");
  pushSingleNote(id, space, userLogin).catch((error: unknown) => {
    console.error(`Background sync failed for note ${id}:`, error);
    // Error is handled in pushSingleNote (sets syncStatus to 'error')
  });

  return id;
}

/**
 * Update an existing note
 *
 * Flow:
 * 1. Update local database with status 'modified'
 * 2. Update updatedAt timestamp
 * 3. Trigger fast sync (push single note)
 *
 * @throws {Error} If note not found
 */
export async function updateNote(input: UpdateNoteInput): Promise<void> {
  const { id, space, content, userLogin } = input;

  // Get existing note to preserve metadata
  const existingNote = await db.notes.get(id);
  if (!existingNote) {
    throw new Error("Note not found");
  }

  // Extract title if present
  const title = extractTitle(content);

  // Extract hashtags from content
  const tags = extractHashtags(content);
  console.log("[updateNote] Content:", content);
  console.log("[updateNote] Extracted tags:", tags);

  // Update local database (critical path)
  await db.notes.update(id, {
    content,
    tags,
    updatedAt: Date.now(), // Update modification timestamp
    syncStatus: "modified",
    title,
  });

  // Trigger background sync (fire and forget)
  const { pushSingleNote } = await import("@/lib/services/sync-service");
  pushSingleNote(id, space, userLogin).catch((error: unknown) => {
    console.error(`Background sync failed for note ${id}:`, error);
    // Error is handled in pushSingleNote (sets syncStatus to 'error')
  });
}

/**
 * Delete a note (Soft Delete / Move to Trash)
 *
 * Local-First Strategy:
 * 1. Mark as deleted locally (immediate UI update)
 * 2. Record deletion time (for future auto-cleanup)
 * 3. Trigger background sync to move file to .trash/ on GitHub
 *
 * @param id - Note ID
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @param userLogin - GitHub username
 * @throws {Error} If note not found
 */
export async function deleteNote(
  id: string,
  space: string,
  userLogin: string
): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) {
    throw new Error("Note not found");
  }

  // 1. Soft delete locally
  await db.notes.update(id, {
    deleted: true,
    deletedAt: Date.now(),
    syncStatus: "pending", // Mark as pending to trigger sync
  });

  // 2. Trigger background sync
  const { pushSingleNote } = await import("@/lib/services/sync-service");

  pushSingleNote(id, space, userLogin).catch((error: unknown) => {
    console.error(`Background delete failed for note ${id}:`, error);
  });
}

/**
 * Restore a note from Trash
 *
 * @param id - Note ID
 * @param space - Space name
 * @param userLogin - GitHub username
 */
export async function restoreNote(
  id: string,
  space: string,
  userLogin: string
): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) {
    throw new Error("Note not found");
  }

  // 1. Restore locally
  await db.notes.update(id, {
    deleted: false,
    deletedAt: undefined,
    syncStatus: "pending",
  });

  // 2. Trigger background sync
  const { pushSingleNote } = await import("@/lib/services/sync-service");

  pushSingleNote(id, space, userLogin).catch((error: unknown) => {
    console.error(`Background restore failed for note ${id}:`, error);
  });
}

/**
 * Toggle a note's template status
 *
 * @param id - Note ID
 * @param space - Space name
 * @param userLogin - GitHub username
 * @param isTemplate - Whether the note should be marked as a template
 */
export async function toggleNoteTemplate(
  id: string,
  space: string,
  userLogin: string,
  isTemplate: boolean
): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) {
    throw new Error("Note not found");
  }

  // Update local database
  await db.notes.update(id, {
    isTemplate,
    syncStatus: "modified",
  });

  // Trigger background sync
  const { pushSingleNote } = await import("@/lib/services/sync-service");

  pushSingleNote(id, space, userLogin).catch((error: unknown) => {
    console.error(`Background template toggle failed for note ${id}:`, error);
  });
}

/**
 * Permanently delete a note (Hard Delete)
 *
 * Removes from local DB and triggers permanent removal from GitHub .trash/
 *
 * @param id - Note ID
 * @param space - Space name
 * @param userLogin - GitHub username
 */
export async function permanentDeleteNote(
  id: string,
  space: string,
  userLogin: string
): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) {
    throw new Error("Note not found");
  }

  // Import services dynamically
  const { octokit } = await import("@/lib/client/github-api");
  const { spaceToRepo } = await import("@/lib/services/space-service");

  const repoName = spaceToRepo(space);

  // Try to delete from GitHub .trash/ (Best effort)
  try {
    // Get SHA of the file in .trash/
    // We might have it in local DB if sync caught up, otherwise try to fetch
    let sha = note.sha;

    // If local SHA is missing or we suspect it's stale, try fetch from .trash
    if (!sha || sha === "pending") {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner: userLogin,
          repo: repoName,
          path: `.trash/${id}.md`,
        });

        if (isGitHubFile(data)) {
          sha = data.sha;
        }
      } catch (e: unknown) {
        if (isErrorWithStatus(e) && e.status !== 404) {
          throw e;
        }
        // If 404, file is already gone from remote, which is fine
      }
    }

    if (sha) {
      await octokit.rest.repos.deleteFile({
        owner: userLogin,
        repo: repoName,
        path: `.trash/${id}.md`,
        message: `Permanent delete note ${id}`,
        sha,
      });
    }
  } catch (error) {
    console.error(`Failed to permanently delete remote file ${id}:`, error);
    // We continue to delete locally even if remote fails (user wants it gone)
    // Ideally we should queue this, but for MVP local-first, cleaning local is priority.
  }

  // Delete from local database
  await db.notes.delete(id);
}

/**
 * Get a single note by ID
 *
 * @param id - Note ID
 * @returns Note object or undefined if not found or deleted
 */
export async function getNote(id: string): Promise<Note | undefined> {
  const note = await db.notes.get(id);
  if (note?.deleted) {
    return undefined;
  }
  return note;
}

/**
 * List all active notes in a space (sorted by date descending)
 * Filters out deleted notes.
 */
export async function listNotes(space: string): Promise<Note[]> {
  return db.notes
    .where("space")
    .equals(space)
    .filter((note) => !note.deleted)
    .reverse()
    .sortBy("date");
}

/**
 * List all notes in Trash for a space
 */
export async function listTrashNotes(space: string): Promise<Note[]> {
  return db.notes
    .where("space")
    .equals(space)
    .filter((note) => note.deleted === true)
    .reverse()
    .sortBy("deletedAt");
}

/**
 * Search notes by query string
 * Only searches active notes.
 */
export async function searchNotes(
  space: string,
  query: string
): Promise<Note[]> {
  const allNotes = await listNotes(space);

  if (!query) {
    return allNotes;
  }

  const lowerQuery = query.toLowerCase();

  return allNotes.filter((note) => {
    if (note.content.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    return false;
  });
}

/**
 * Get notes by tag (Active only)
 */
export async function getNotesByTag(
  space: string,
  tag: string
): Promise<Note[]> {
  const lowerTag = tag.toLowerCase();

  return db.notes
    .where("space")
    .equals(space)
    .filter(
      (note) =>
        !note.deleted && note.tags.some((t) => t.toLowerCase() === lowerTag)
    )
    .reverse()
    .sortBy("date");
}

/**
 * Get all unique tags in a space (Active notes only)
 */
export async function getAllTags(space: string): Promise<string[]> {
  const notes = await db.notes
    .where("space")
    .equals(space)
    .filter((note) => !note.deleted)
    .toArray();

  const tagSet = new Set<string>();
  notes.forEach((note) => {
    note.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Get note count by sync status (Active notes only)
 */
export async function getNoteStatusCounts(space: string): Promise<{
  total: number;
  synced: number;
  pending: number;
  modified: number;
  syncing: number;
  error: number;
}> {
  const notes = await db.notes
    .where("space")
    .equals(space)
    .filter((note) => !note.deleted)
    .toArray();

  const counts = {
    total: notes.length,
    synced: 0,
    pending: 0,
    modified: 0,
    syncing: 0,
    error: 0,
  };

  notes.forEach((note) => {
    counts[note.syncStatus]++;
  });

  return counts;
}
