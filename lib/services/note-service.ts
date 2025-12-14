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
 * Delete a note from both GitHub and local database
 * 
 * Flow:
 * 1. Delete from GitHub first (to ensure data safety)
 * 2. Delete from local database after successful remote deletion
 * 
 * @param id - Note ID
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @param userLogin - GitHub username
 * @throws {Error} If note not found or GitHub deletion fails
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

  // Import services dynamically to avoid circular dependency
  const { fetchGitHub } = await import('@/lib/client/github-api');
  const { spaceToRepo } = await import('@/lib/services/space-service');

  // Convert space name to repo name
  const repoName = spaceToRepo(space);
  const repoPath = `repos/${userLogin}/${repoName}`;

  // Get SHA if needed
  let sha = note.sha;
  if (sha === 'pending' || !sha) {
    const res = await fetchGitHub(`${repoPath}/contents/notes/${id}.md`);
    sha = res.sha;
  }

  // Delete from GitHub first
  await fetchGitHub(`${repoPath}/contents/notes/${id}.md`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Delete note ${id}`,
      sha,
    }),
  });

  // Delete from local database after successful remote deletion
  await db.notes.delete(id);
}

/**
 * Get a single note by ID
 * 
 * @param id - Note ID
 * @returns Note object or undefined if not found
 */
export async function getNote(id: string): Promise<Note | undefined> {
  return db.notes.get(id);
}

/**
 * List all notes in a space (sorted by date descending)
 * 
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @returns Array of notes, newest first
 */
export async function listNotes(space: string): Promise<Note[]> {
  return db.notes
    .where('space')
    .equals(space)
    .reverse()
    .sortBy('date');
}

/**
 * Search notes by query string
 * 
 * Searches in:
 * - Note content (case-insensitive)
 * - Tags (case-insensitive)
 * 
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @param query - Search query string
 * @returns Filtered notes matching query
 */
export async function searchNotes(space: string, query: string): Promise<Note[]> {
  const allNotes = await listNotes(space);
  
  if (!query) return allNotes;
  
  const lowerQuery = query.toLowerCase();
  
  return allNotes.filter(note => {
    // Search in content
    if (note.content.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in tags
    if (note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
    
    return false;
  });
}

/**
 * Get notes by tag
 * 
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @param tag - Tag to filter by (case-insensitive)
 * @returns Notes containing the specified tag
 */
export async function getNotesByTag(space: string, tag: string): Promise<Note[]> {
  const lowerTag = tag.toLowerCase();
  
  return db.notes
    .where('space')
    .equals(space)
    .filter(note => note.tags.some(t => t.toLowerCase() === lowerTag))
    .reverse()
    .sortBy('date');
}

/**
 * Get all unique tags in a space
 * 
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @returns Array of unique tags, sorted alphabetically
 */
export async function getAllTags(space: string): Promise<string[]> {
  const notes = await db.notes.where('space').equals(space).toArray();
  
  const tagSet = new Set<string>();
  notes.forEach(note => {
    note.tags.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet).sort();
}

/**
 * Get note count by sync status
 * 
 * Useful for UI indicators (e.g., "3 pending", "1 error")
 * 
 * @param space - Space name without .marlin suffix (e.g., "work")
 * @returns Object with counts for each status
 */
export async function getNoteStatusCounts(space: string): Promise<{
  total: number;
  synced: number;
  pending: number;
  modified: number;
  syncing: number;
  error: number;
}> {
  const notes = await db.notes.where('space').equals(space).toArray();
  
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
