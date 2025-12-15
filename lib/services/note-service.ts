/**
 * Note Service (Business Layer - Local-First)
 * 
 * Responsibilities:
 * - Create, update, delete notes (optimistic updates)
 * - Generate note IDs
 * - Coordinate with sync engine (fast path)
 * - Query notes from local database
 * 
 * Depends on:
 * - lib/client/db.ts
 * - lib/services/sync-service.ts (for fast sync)
 */

import { db, type Note } from '@/lib/client/db';

export interface CreateNoteInput {
  content: string;
  tags: string[];
  space: string; // Space name without .marlin suffix (e.g., "work")
  userLogin: string;
}

export interface UpdateNoteInput {
  id: string;
  space: string; // Space name without .marlin suffix (e.g., "work")
  content: string;
  tags: string[];
  userLogin: string;
}

/**
 * Create a new note
 * 
 * Flow:
 * 1. Generate ID from timestamp
 * 2. Write to Dexie with status 'pending'
 * 3. Trigger fast sync (push single note)
 * 4. Return note ID for UI reference
 * 
 * @returns Note ID (timestamp string)
 */
export async function createNote(input: CreateNoteInput): Promise<string> {
  const { content, tags, space, userLogin } = input;
  
  // Generate ID (timestamp without .md suffix)
  const date = Date.now();
  const id = String(date);
  
  // Write to local database (critical path)
  await db.notes.add({
    id,
    content,
    tags,
    date,
    space,
    syncStatus: 'pending',
    sha: undefined,
  });
  
  // Trigger background sync (fire and forget)
  // Import dynamically to avoid circular dependency
  const { pushSingleNote } = await import('@/lib/services/sync-service');
  pushSingleNote(id, space, userLogin).catch((error: any) => {
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
 * 2. Trigger fast sync (push single note)
 * 
 * @throws {Error} If note not found
 */
export async function updateNote(input: UpdateNoteInput): Promise<void> {
  const { id, space, content, tags, userLogin } = input;
  
  // Get existing note to preserve metadata
  const existingNote = await db.notes.get(id);
  if (!existingNote) {
    throw new Error('Note not found');
  }
  
  // Update local database (critical path)
  await db.notes.update(id, {
    content,
    tags,
    syncStatus: 'modified',
  });
  
  // Trigger background sync (fire and forget)
  const { pushSingleNote } = await import('@/lib/services/sync-service');
  pushSingleNote(id, space, userLogin).catch((error: any) => {
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
    throw new Error('Note not found');
  }

  // 1. Soft delete locally
  await db.notes.update(id, {
    deleted: true,
    deletedAt: Date.now(),
    syncStatus: 'pending', // Mark as pending to trigger sync
  });

  // 2. Trigger background sync
  const { pushSingleNote } = await import('@/lib/services/sync-service');
  
  pushSingleNote(id, space, userLogin).catch((error: any) => {
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
    throw new Error('Note not found');
  }

  // 1. Restore locally
  await db.notes.update(id, {
    deleted: false,
    deletedAt: undefined,
    syncStatus: 'pending',
  });

  // 2. Trigger background sync
  const { pushSingleNote } = await import('@/lib/services/sync-service');
  
  pushSingleNote(id, space, userLogin).catch((error: any) => {
    console.error(`Background restore failed for note ${id}:`, error);
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
    throw new Error('Note not found');
  }

  // Import services dynamically
  const { fetchGitHub } = await import('@/lib/client/github-api');
  const { spaceToRepo } = await import('@/lib/services/space-service');

  const repoName = spaceToRepo(space);
  const repoPath = `repos/${userLogin}/${repoName}`;

  // Try to delete from GitHub .trash/ (Best effort)
  try {
    // Get SHA of the file in .trash/
    // We might have it in local DB if sync caught up, otherwise try to fetch
    let sha = note.sha;
    
    // If local SHA is missing or we suspect it's stale, try fetch from .trash
    if (!sha || sha === 'pending') {
       try {
         const res = await fetchGitHub(`${repoPath}/contents/.trash/${id}.md`);
         sha = res.sha;
       } catch (e: any) {
         if (e.status !== 404) throw e;
         // If 404, file is already gone from remote, which is fine
       }
    }

    if (sha) {
      await fetchGitHub(`${repoPath}/contents/.trash/${id}.md`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Permanent delete note ${id}`,
          sha,
        }),
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
  if (note?.deleted) return undefined;
  return note;
}

/**
 * List all active notes in a space (sorted by date descending)
 * Filters out deleted notes.
 */
export async function listNotes(space: string): Promise<Note[]> {
  return db.notes
    .where('space')
    .equals(space)
    .filter(note => !note.deleted)
    .reverse()
    .sortBy('date');
}

/**
 * List all notes in Trash for a space
 */
export async function listTrashNotes(space: string): Promise<Note[]> {
  return db.notes
    .where('space')
    .equals(space)
    .filter(note => note.deleted === true)
    .reverse()
    .sortBy('deletedAt');
}

/**
 * Search notes by query string
 * Only searches active notes.
 */
export async function searchNotes(space: string, query: string): Promise<Note[]> {
  const allNotes = await listNotes(space);
  
  if (!query) return allNotes;
  
  const lowerQuery = query.toLowerCase();
  
  return allNotes.filter(note => {
    if (note.content.toLowerCase().includes(lowerQuery)) return true;
    if (note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
    return false;
  });
}

/**
 * Get notes by tag (Active only)
 */
export async function getNotesByTag(space: string, tag: string): Promise<Note[]> {
  const lowerTag = tag.toLowerCase();
  
  return db.notes
    .where('space')
    .equals(space)
    .filter(note => !note.deleted && note.tags.some(t => t.toLowerCase() === lowerTag))
    .reverse()
    .sortBy('date');
}

/**
 * Get all unique tags in a space (Active notes only)
 */
export async function getAllTags(space: string): Promise<string[]> {
  const notes = await db.notes
    .where('space')
    .equals(space)
    .filter(note => !note.deleted)
    .toArray();
  
  const tagSet = new Set<string>();
  notes.forEach(note => {
    note.tags.forEach(tag => tagSet.add(tag));
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
    .where('space')
    .equals(space)
    .filter(note => !note.deleted)
    .toArray();
  
  const counts = {
    total: notes.length,
    synced: 0,
    pending: 0,
    modified: 0,
    syncing: 0,
    error: 0,
  };
  
  notes.forEach(note => {
    counts[note.syncStatus]++;
  });
  
  return counts;
}
