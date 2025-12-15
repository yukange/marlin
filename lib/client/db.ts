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

import Dexie, { type EntityTable } from 'dexie';

export interface Note {
  id: string; // Timestamp without .md suffix (e.g., "1700000000001")
  content: string; // Pure markdown content (frontmatter stripped)
  tags: string[]; // Parsed from frontmatter or #hashtags
  date: number; // Unix timestamp
  space: string; // Space name WITHOUT .marlin suffix (e.g., "work")
  sha?: string; // Git blob SHA for sync diffing (undefined for new notes)
  syncStatus: 'synced' | 'modified' | 'pending' | 'syncing' | 'error';
  errorMessage?: string; // Error details if syncStatus === 'error'
}

export interface Space {
  name: string; // Primary key: display name WITHOUT .marlin suffix (e.g., "work")
  repoName: string; // Full repo name WITH .marlin suffix (e.g., "work.marlin") - INTERNAL USE ONLY
  description: string | null;
  isPrivate: boolean;
  updatedAt: number; // Unix timestamp
}

export const db = new Dexie('marlin_db') as Dexie & {
  notes: EntityTable<Note, 'id'>;
  spaces: EntityTable<Space, 'name'>;
};

// Version 1: Initial schema
db.version(1).stores({
  notes: 'id, sha, content, *tags, date, space'
});

// Version 2: Add spaces table
db.version(2).stores({
  notes: 'id, sha, content, *tags, date, space',
  spaces: 'name, repoName, updatedAt'
});

// Version 3: Add syncStatus and errorMessage fields
db.version(3).stores({
  notes: 'id, sha, content, *tags, date, space, syncStatus',
  spaces: 'name, repoName, updatedAt'
}).upgrade(tx => {
  return tx.table('notes').toCollection().modify(note => {
    // Migrate old sha-based status to new syncStatus field
    if (note.sha === 'pending') {
      note.syncStatus = 'pending'
      note.sha = undefined
    } else if (note.sha === 'syncing') {
      note.syncStatus = 'syncing'
      note.sha = undefined
    } else if (typeof note.sha === 'string' && note.sha.startsWith('error:')) {
      note.syncStatus = 'error'
      note.errorMessage = note.sha.slice(6)
      note.sha = undefined
    } else {
      note.syncStatus = 'synced'
    }
  })
});

// Version 4: Add compound index for efficient sorting by date within a space
db.version(4).stores({
  notes: 'id, sha, content, *tags, date, space, syncStatus, [space+date]',
  spaces: 'name, repoName, updatedAt'
});

/**
 * Check if there are any unsynced changes in the database
 * 
 * @returns true if any notes have status other than 'synced'
 */
export async function hasUnsyncedChanges(): Promise<boolean> {
  const unsyncedCount = await db.notes
    .where('syncStatus')
    .anyOf(['pending', 'modified', 'syncing', 'error'])
    .count();
  return unsyncedCount > 0;
}
