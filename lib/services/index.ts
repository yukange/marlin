/**
 * Services Layer Exports
 * 
 * Re-export business services for convenience.
 * This is the primary interface for application logic.
 */

// Auth Service
export {
  getUserProfile,
  getRateLimit,
  isAuthenticated,
} from './auth-service';
export type { GitHubUser, RateLimit } from './auth-service';

// Space Service
export {
  getUserSpaces,
  getLocalSpaces,
  createSpace,
  deleteSpace,
  validateSpaceName,
  spaceToRepo,
  repoToSpace,
  githubRepoToSpace,
} from './space-service';
export type { GitHubRepo } from './space-service';

// Note Service
export {
  createNote,
  updateNote,
  deleteNote,
  getNote,
  listNotes,
  searchNotes,
  getNotesByTag,
  getAllTags,
  getNoteStatusCounts,
} from './note-service';
export type { CreateNoteInput, UpdateNoteInput } from './note-service';

// Sync Service
export {
  pushSingleNote,
  syncWorkspace,
  retrySingleNote,
} from './sync-service';
