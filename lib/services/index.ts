/**
 * Service Layer Exports
 *
 * All business logic should be accessed through these exports.
 * Services are organized by domain (auth, repo, notes, sync).
 */

export { getUserProfile, getRateLimit, isAuthenticated } from "./auth-service";

export {
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  getNote,
  listNotes,
  listTrashNotes,
  searchNotes,
  getNotesByTag,
  getAllTags,
  getNoteStatusCounts,
  toggleNoteTemplate,
} from "./note-service";

export { pushSingleNote, syncWorkspace, retrySingleNote } from "./sync-service";

export { getRepo, initializeRepo, REPO_NAME } from "./repo-service";
export type { GitHubRepo } from "./repo-service";

export { publishToGist, getGistContent } from "./share-service";
