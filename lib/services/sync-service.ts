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
import { fetchNotesTree, fetchBlobs } from '@/lib/client/github-api';
import { spaceToRepo } from '@/lib/services/space-service';
import { stringifyNote, parseNote } from '@/lib/utils/markdown';
import { isGitHubFile, isErrorWithStatus, getErrorMessage } from '@/lib/utils/type-guards';

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
    // Note might have been permanently deleted
    return;
  }

  // Skip if already synced (checking both active and trash states)
  if (note.syncStatus === 'synced') {
    return;
  }

  // Import locally to avoid circular deps
  const { octokit } = await import('@/lib/client/github-api');

  try {
    // Mark as syncing
    await db.notes.update(noteId, { syncStatus: 'syncing' });

    // Prepare content (handles both active and deleted states via metadata)
    const fileContent = stringifyNote(note);
    const contentBase64 = btoa(
      String.fromCharCode(...new TextEncoder().encode(fileContent))
    );

    // Define paths
    const activePath = `notes/${noteId}.md`;
    const trashPath = `.trash/${noteId}.md`;

    // --- BRANCH 1: SOFT DELETE (Move to .trash) ---
    if (note.deleted) {
      // 1. Upload to .trash/
      // We don't have the SHA for the trash file usually (unless we tracked it), 
      // but if it's a fresh move, it's a create (sha=undefined). 
      // If it's an update to an already trashed note, we might need its SHA.
      // For simplicity/robustness in MVP: Try create. If 409 (exists), fetch SHA and update.
      let trashSha: string | undefined = undefined;

      try {
        // Optimistic create/update
        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
          owner: userLogin,
          repo: repoName,
          path: trashPath,
          message: `Move note ${noteId} to trash`,
          content: contentBase64,
          sha: trashSha, // Undefined initially
        });
        trashSha = data.content!.sha!;
      } catch (e: unknown) {
        if (isErrorWithStatus(e) && (e.status === 409 || getErrorMessage(e).includes('sha'))) {
          // File exists, fetch SHA and retry update
          const { data: existing } = await octokit.rest.repos.getContent({
            owner: userLogin,
            repo: repoName,
            path: trashPath,
          });

          if (isGitHubFile(existing)) {
            const { data } = await octokit.rest.repos.createOrUpdateFileContents({
              owner: userLogin,
              repo: repoName,
              path: trashPath,
              message: `Update note ${noteId} in trash`,
              content: contentBase64,
              sha: existing.sha,
            });
            trashSha = data.content!.sha!;
          } else {
            throw new Error('Retrieved object is not a file');
          }
        } else {
          throw e;
        }
      }

      // 2. Delete from notes/ (Cleanup)
      // Use the known SHA from local DB (which refers to the active note)
      if (note.sha && note.sha !== 'pending') {
        try {
          await octokit.rest.repos.deleteFile({
            owner: userLogin,
            repo: repoName,
            path: activePath,
            message: `Cleanup active note ${noteId}`,
            sha: note.sha,
          });
        } catch (e: unknown) {
          if (isErrorWithStatus(e) && e.status !== 404) {
            console.warn(`Failed to cleanup active note ${noteId}:`, e);
            // Non-fatal, just means it might not have existed or SHA mismatch
          }
        }
      }

      // 3. Update local state
      await db.notes.update(noteId, {
        sha: trashSha, // Track the SHA of the file in .trash
        syncStatus: 'synced',
        errorMessage: undefined,
      });
      return;
    }

    // --- BRANCH 2: RESTORE or UPDATE (Move to notes/) ---
    // 1. Upload to notes/

    let response;
    try {
      response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: userLogin,
        repo: repoName,
        path: activePath,
        message: note.sha ? `Update note ${noteId}` : `Create note ${noteId}`,
        content: contentBase64,
        sha: note.sha,
      });
    } catch (e: unknown) {
      // If SHA was from .trash file, it won't work for notes/ file (which might not exist or has diff SHA).
      // Fallback: Fetch SHA of notes/ file (if exists) or use null (create).
      try {
        const { data: existing } = await octokit.rest.repos.getContent({
          owner: userLogin,
          repo: repoName,
          path: activePath,
        });

        if (isGitHubFile(existing)) {
          response = await octokit.rest.repos.createOrUpdateFileContents({
            owner: userLogin,
            repo: repoName,
            path: activePath,
            message: `Update note ${noteId}`,
            content: contentBase64,
            sha: existing.sha,
          });
        } else {
          throw new Error('Retrieved object is not a file');
        }
      } catch (inner: unknown) {
        if (isErrorWithStatus(inner) && inner.status === 404) {
          // File doesn't exist, create it (sha = undefined)
          response = await octokit.rest.repos.createOrUpdateFileContents({
            owner: userLogin,
            repo: repoName,
            path: activePath,
            message: `Restore note ${noteId}`,
            content: contentBase64,
            sha: undefined,
          });
        } else {
          throw inner;
        }
      }
    }

    // 2. Delete from .trash/ (Cleanup if restoring)
    // We don't track if we are specifically restoring, so we can just check if file exists in trash and kill it.
    // To save API calls, maybe only do this if we suspect it was in trash?
    // Cost of 404 is low.
    try {
      const { data: trashFile } = await octokit.rest.repos.getContent({
        owner: userLogin,
        repo: repoName,
        path: trashPath,
      });

      if (isGitHubFile(trashFile)) {
        await octokit.rest.repos.deleteFile({
          owner: userLogin,
          repo: repoName,
          path: trashPath,
          message: `Cleanup trash note ${noteId}`,
          sha: trashFile.sha,
        });
      }
    } catch (e: unknown) {
      // Ignore 404 (not in trash)
    }

    // 3. Update local state
    if (response?.data?.content?.sha) {
      await db.notes.update(noteId, {
        sha: response.data.content.sha,
        syncStatus: 'synced',
        errorMessage: undefined,
      });
    } else {
      throw new Error("Failed to get SHA from response");
    }

  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error);
    // Handle 409 Conflict (remote has changed)
    if (errorMsg.includes('409') || errorMsg.includes('does not match')) {
      await db.notes.update(noteId, {
        syncStatus: 'error',
        errorMessage: 'Conflict detected. Please sync workspace.',
      });
    } else {
      // Other errors (network, auth, etc.)
      await db.notes.update(noteId, {
        syncStatus: 'error',
        errorMessage: errorMsg || 'Sync failed',
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
  let noteFiles;
  try {
    noteFiles = await fetchNotesTree(userLogin, repoName);
  } catch (error: unknown) {
    // If repo was deleted remotely (404), clean up local space
    if (isErrorWithStatus(error) && error.status === 404) {
      console.log(`Remote repository ${repoName} not found, cleaning up local space ${space}`);

      // Delete all notes in this space
      await db.transaction('rw', db.notes, db.spaces, async () => {
        await db.notes.where('space').equals(space).delete();
        await db.spaces.delete(space);
      });

      throw new Error('Remote repository was deleted');
    }
    throw error;
  }

  // Update the tree SHA if we didn't get it earlier or if we are here now
  // Since fetchNotesTree doesn't return the tree SHA, we might rely on the earlier fetch or just return undefined if we missed it.
  // Actually, let's trust the one we got if we did.

  // Build remote map (ID without .md suffix -> { sha, path })
  const remoteMap = new Map<string, { sha: string; path: string }>(
    noteFiles.map((f) => [
      f.path.split('/').pop()!.replace(/\.md$/, ''), // Strip .md suffix
      { sha: f.sha, path: f.path }
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
            const parsed = parseNote(content, file.id);
            const isTrash = file.path.startsWith('.trash/');

            await db.notes.put({
              id: file.id,
              sha: file.sha,
              content: parsed.content,
              tags: parsed.tags,
              date: parsed.date,
              createdAt: parsed.createdAt,
              updatedAt: parsed.updatedAt,
              space: space,
              syncStatus: 'synced',
              deleted: isTrash, // Enforce deleted status based on folder
              deletedAt: isTrash ? (parsed.deletedAt || Date.now()) : undefined,
              title: parsed.title,
              isTemplate: parsed.isTemplate,
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
    // Skip if already synced (whether active or deleted)
    if (note.syncStatus === 'synced') continue;

    // --- HANDLE DELETION (SOFT DELETE / MOVE) IN SLOW PATH ---
    if (note.deleted) {
      // Logic: Move to .trash/
      // 1. Put to .trash/
      // 2. Delete from notes/

      try {
        await db.notes.update(note.id, { syncStatus: 'syncing' });

        // Import locally
        const { octokit } = await import('@/lib/client/github-api');

        // 1. Upload to .trash/
        const fileContent = stringifyNote(note);
        const contentBase64 = btoa(
          String.fromCharCode(...new TextEncoder().encode(fileContent))
        );

        let trashSha: string | undefined = undefined;

        try {
          const { data } = await octokit.rest.repos.createOrUpdateFileContents({
            owner: userLogin,
            repo: repoName,
            path: `.trash/${note.id}.md`,
            message: `Sync move note ${note.id} to trash`,
            content: contentBase64,
            sha: undefined, // Try create first
          });
          trashSha = data.content!.sha!;
        } catch (e: unknown) {
          // Handle both 409 (Conflict) and 422 (Unprocessable Entity - often means file exists but no SHA provided)
          const errMsg = getErrorMessage(e);
          if ((isErrorWithStatus(e) && (e.status === 409 || e.status === 422)) || errMsg.includes('sha')) {
            // Exists, fetch SHA and update
            const { data: existing } = await octokit.rest.repos.getContent({
              owner: userLogin,
              repo: repoName,
              path: `.trash/${note.id}.md`
            });

            if (isGitHubFile(existing)) {
              const { data } = await octokit.rest.repos.createOrUpdateFileContents({
                owner: userLogin,
                repo: repoName,
                path: `.trash/${note.id}.md`,
                message: `Sync update note ${note.id} in trash`,
                content: contentBase64,
                sha: existing.sha,
              });
              trashSha = data.content!.sha!;
            } else {
              throw new Error('Retrieved object is not a file');
            }
          } else {
            throw e;
          }
        }

        // 2. Delete from notes/ (Cleanup)
        const remoteInfo = remoteMap.get(note.id);

        // Only try to delete if it exists in 'notes/' directory remotely
        if (remoteInfo && remoteInfo.path.startsWith('notes/')) {
          try {
            await octokit.rest.repos.deleteFile({
              owner: userLogin,
              repo: repoName,
              path: `notes/${note.id}.md`,
              message: `Cleanup active note ${note.id}`,
              sha: remoteInfo.sha, // Use the correct SHA from the correct path
            });
          } catch (e: unknown) {
            // Ignore 404
          }
        }

        await db.notes.update(note.id, {
          sha: trashSha,
          syncStatus: 'synced',
          errorMessage: undefined
        });
        uploaded++;
      } catch (e: unknown) {
        console.error(`Failed to sync deletion for ${note.id}:`, e);
        await db.notes.update(note.id, {
          syncStatus: 'error',
          errorMessage: getErrorMessage(e) || 'Delete sync failed'
        });
      }
      continue;
    }

    if (['pending', 'modified', 'error'].includes(note.syncStatus)) {

      const remoteInfo = remoteMap.get(note.id);
      const remoteSha = remoteInfo?.sha;

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

        // Import locally
        const { octokit } = await import('@/lib/client/github-api');

        const fileContent = stringifyNote(note);
        const contentBase64 = btoa(
          String.fromCharCode(...new TextEncoder().encode(fileContent))
        );

        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
          owner: userLogin,
          repo: repoName,
          path: `notes/${note.id}.md`,
          message: `Sync note ${note.id}`,
          content: contentBase64,
          sha: note.sha,
        });

        await db.notes.update(note.id, {
          sha: data.content!.sha!,
          syncStatus: 'synced',
          errorMessage: undefined,
        });
        uploaded++;
      } catch (error: unknown) {
        console.error(`Failed to upload note ${note.id}:`, error);
        await db.notes.update(note.id, {
          syncStatus: 'error',
          errorMessage: getErrorMessage(error) || 'Upload failed',
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