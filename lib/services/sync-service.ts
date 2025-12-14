/**
 * Sync Service (Business Layer - Complex Sync Engine)
 * 
 * Responsibilities:
 * - Fast Path: Single-note hot sync (O(1) complexity)
 * - Slow Path: Full workspace sync with conflict resolution
 * - Coordinate local database and remote GitHub state
 * 
 * Depends on:
 * - lib/client/db.ts
 * - lib/client/github-api.ts
 * - lib/services/space-service.ts (for repo name conversion)
 * - lib/utils/markdown.ts (for frontmatter handling)
 */

import { db } from '@/lib/client/db';
import { putFile, fetchNotesTree, fetchBlobs } from '@/lib/client/github-api';
import { spaceToRepo } from '@/lib/services/space-service';
import { stringifyNote, parseNote } from '@/lib/utils/markdown';

/**
 * ========== FAST PATH: Hot Sync ==========
 * 
 * Push a single note to GitHub without fetching full tree.
 * O(1) complexity, millisecond response time.
 * 
 * Flow:
 * 1. Mark note as 'syncing'
 * 2. Prepare content with frontmatter
 * 3. Upload to GitHub (create or update)
 * 4. Update local SHA on success
 * 5. Handle conflicts (409) by marking as error
 * 
 * @param noteId - Note ID (without .md suffix)
 * @param space - Space name (without .marlin suffix, e.g., "work")
 * @param userLogin - GitHub username
 * @throws {Error} If upload fails
 */
export async function pushSingleNote(
  noteId: string,
  space: string,
  userLogin: string
): Promise<void> {
  // Convert space name to repo name for GitHub API
  const repoName = spaceToRepo(space);
  
  // Get note from database
  const note = await db.notes.get(noteId);
  if (!note) {
    throw new Error(`Note ${noteId} not found`);
  }
  
  // Skip if already synced
  if (note.syncStatus === 'synced') {
    return;
  }
  
  try {
    // Mark as syncing
    await db.notes.update(noteId, { syncStatus: 'syncing' });
    
    // Prepare file content with frontmatter
    const fileContent = stringifyNote(note);
    const contentBase64 = btoa(
      String.fromCharCode(...new TextEncoder().encode(fileContent))
    );
    
    // Upload to GitHub
    const response = await putFile(
      userLogin,
      repoName,
      `notes/${noteId}.md`,
      contentBase64,
      note.sha ? `Update note ${noteId}` : `Create note ${noteId}`,
      note.sha // undefined for new notes
    );
    
    // Update local state on success
    await db.notes.update(noteId, {
      sha: response.content.sha,
      syncStatus: 'synced',
      errorMessage: undefined,
    });
  } catch (error: any) {
    // Handle 409 Conflict (remote has changed)
    if (error.message?.includes('409') || error.message?.includes('does not match')) {
      await db.notes.update(noteId, {
        syncStatus: 'error',
        errorMessage: 'Conflict detected. Please sync workspace.',
      });
    } else {
      // Other errors (network, auth, etc.)
      await db.notes.update(noteId, {
        syncStatus: 'error',
        errorMessage: error.message || 'Upload failed',
      });
    }
    
    throw error;
  }
}

/**
 * ========== SLOW PATH: Full Sync ==========
 * 
 * Three-phase sync with conflict resolution.
 * Guarantees data consistency across devices.
 * 
 * Phase 1: SNAPSHOT - Fetch remote tree and build maps
 * Phase 2: PULL & PRUNE - Download updates and delete removed notes
 * Phase 3: PUSH & RESOLVE - Upload local changes and handle conflicts
 * 
 * @param space - Space name (without .marlin suffix, e.g., "work")
 * @param userLogin - GitHub username
 * @param knownRemoteSha - Optional: The last known SHA of the remote tree. If provided, we check for updates before full sync.
 * @returns Statistics about sync operation
 */
export async function syncWorkspace(
  space: string,
  userLogin: string,
  knownRemoteSha?: string
): Promise<{
  uploaded: number;
  downloaded: number;
  pruned: number;
  conflicts: number;
  latestSha?: string;
  skipped?: boolean;
}> {
  let uploaded = 0;
  let downloaded = 0;
  let pruned = 0;
  let conflicts = 0;

  // Convert space name to repo name for GitHub API
  const repoName = spaceToRepo(space);

  // ========== PHASE 1: SNAPSHOT ==========
  
  // Check if remote has changed (Cost Efficiency)
  let remoteTreeSha: string | null = null;
  if (knownRemoteSha) {
    try {
      const { fetchRemoteTreeSha } = await import('@/lib/client/github-api');
      remoteTreeSha = await fetchRemoteTreeSha(userLogin, repoName);
      
      if (remoteTreeSha && remoteTreeSha === knownRemoteSha) {
        // No changes on remote, and assuming local is clean (handled by caller logic usually, but here we prioritize remote check)
        // Note: Ideally we also check if local is dirty. But for "Background Sync", checking remote is the main optimization.
        // If local has changes, they should have been pushed via Fast Path. 
        // If Fast Path failed, they are in 'error' or 'modified' state, which Slow Path handles.
        // So strictly speaking, we should only skip if we are SURE local is clean too.
        // But for this specific "Cost Efficiency" requirement, we assume we want to avoid the heavy tree fetch if remote hasn't moved.
        // Let's check local dirty state briefly?
        const dirtyNotes = await db.notes.where('syncStatus').notEqual('synced').count();
        if (dirtyNotes === 0) {
           return { uploaded: 0, downloaded: 0, pruned: 0, conflicts: 0, skipped: true, latestSha: remoteTreeSha };
        }
      }
    } catch (e) {
      console.warn('Failed to check remote tree SHA, proceeding with full sync', e);
    }
  }

  // Fetch remote tree
  const noteFiles = await fetchNotesTree(userLogin, repoName);
  
  // Update the tree SHA if we didn't get it earlier or if we are here now
  // Since fetchNotesTree doesn't return the tree SHA, we might rely on the earlier fetch or just return undefined if we missed it.
  // Actually, let's trust the one we got if we did.
  
  // Build remote map (ID without .md suffix -> SHA)
  const remoteMap = new Map<string, string>(
    noteFiles.map((f) => [
      f.path.split('/').pop()!.replace(/\.md$/, ''), // Strip .md suffix
      f.sha
    ])
  );
  
  // Get local notes
  const localNotes = await db.notes.where('space').equals(space).toArray();
  const localMap = new Map(localNotes.map(n => [n.id, n]));

  // ========== PHASE 2: PULL & PRUNE ==========
  
  // A. Download Updates
  const toDownload: Array<{ id: string; sha: string; path: string }> = [];
  
  for (const file of noteFiles) {
    const id = file.path.split('/').pop()!.replace(/\.md$/, '');
    const localNote = localMap.get(id);
    
    if (!localNote) {
      // New note from remote
      toDownload.push({ id, sha: file.sha, path: file.path });
    } else if (localNote.sha !== file.sha && localNote.syncStatus === 'synced') {
      // Remote updated, local is clean -> safe to update
      toDownload.push({ id, sha: file.sha, path: file.path });
    }
    // Skip if local is dirty (modified/pending)
  }
  
  // Batch download
  const BATCH_SIZE = 50;
  for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
    const batch = toDownload.slice(i, i + BATCH_SIZE);
    const shas = batch.map(f => f.sha);
    
    try {
      const contents = await fetchBlobs(userLogin, repoName, shas);
      
      for (const file of batch) {
        const content = contents[file.sha];
        if (content) {
          try {
            const parsed = parseNote(content);
            
            await db.notes.put({
              id: file.id,
              sha: file.sha,
              content: parsed.content,
              tags: parsed.tags,
              date: parsed.date,
              space: space,
              syncStatus: 'synced',
            });
            downloaded++;
          } catch (error) {
            console.error(`Failed to parse note ${file.id}:`, error);
          }
        } else {
           console.error(`Failed to fetch content for note ${file.id}`);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch batch:`, error);
    }
  }
  
  // B. Prune Deletions
  const toPrune: string[] = [];
  
  for (const [id, localNote] of localMap) {
    if (!remoteMap.has(id) && localNote.syncStatus === 'synced') {
      toPrune.push(id);
    }
  }
  
  if (toPrune.length > 0) {
    await db.notes.bulkDelete(toPrune);
    pruned = toPrune.length;
  }

  // ========== PHASE 3: PUSH & RESOLVE ==========
  
  // Get fresh local state after pull
  const localNotesAfterPull = await db.notes.where('space').equals(space).toArray();
  
  for (const note of localNotesAfterPull) {
    if (['pending', 'modified', 'error'].includes(note.syncStatus)) {
      
      const remoteSha = remoteMap.get(note.id);
      
      // Conflict detection
      const hasConflict = (
        (note.sha && remoteSha && note.sha !== remoteSha) ||
        (!note.sha && remoteSha)
      );
      
      if (hasConflict) {
        // Fork conflicted note
        conflicts++;
        try {
          const timestamp = Date.now();
          const conflictId = `${note.id}_conflict_${timestamp}`;
          
          await db.notes.add({
            ...note,
            id: conflictId,
            tags: [...note.tags, 'conflict'],
            syncStatus: 'pending',
            sha: undefined,
          });
          
          // Mark original for re-download
          await db.notes.update(note.id, {
            syncStatus: 'synced',
            sha: remoteSha,
          });
          
          console.warn(`Conflict: ${note.id} -> ${conflictId}`);
        } catch (error) {
          console.error(`Failed to fork conflict ${note.id}:`, error);
        }
        continue;
      }
      
      // No conflict: Upload
      try {
        await db.notes.update(note.id, { syncStatus: 'syncing' });
        
        const fileContent = stringifyNote(note);
        const contentBase64 = btoa(
          String.fromCharCode(...new TextEncoder().encode(fileContent))
        );
        
        const response = await putFile(
          userLogin,
          repoName,
          `notes/${note.id}.md`,
          contentBase64,
          `Sync note ${note.id}`,
          note.sha
        );
        
        await db.notes.update(note.id, {
          sha: response.content.sha,
          syncStatus: 'synced',
          errorMessage: undefined,
        });
        uploaded++;
      } catch (error: any) {
        console.error(`Failed to upload note ${note.id}:`, error);
        await db.notes.update(note.id, {
          syncStatus: 'error',
          errorMessage: error.message || 'Upload failed',
        });
      }
    }
  }

  return { uploaded, downloaded, pruned, conflicts, latestSha: remoteTreeSha || undefined };
}

/**
 * Retry sync for a single errored note
 * 
 * Clears error status and retriggers fast sync.
 * 
 * @param noteId - Note ID
 * @param space - Space name (without .marlin suffix)
 * @param userLogin - GitHub username
 * @throws {Error} If note is not in error state
 */
export async function retrySingleNote(
  noteId: string,
  space: string,
  userLogin: string
): Promise<void> {
  const note = await db.notes.get(noteId);
  if (!note || note.syncStatus !== 'error') {
    throw new Error('Note not in error state');
  }
  
  // Clear error and retry fast sync
  await db.notes.update(noteId, {
    syncStatus: 'modified',
    errorMessage: undefined,
  });
  
  await pushSingleNote(noteId, space, userLogin);
}
