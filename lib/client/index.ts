/**
 * Client Layer Exports
 *
 * Re-export infrastructure layer for convenience.
 * This is the ONLY place where components should import database/API clients from.
 */

export { db, hasUnsyncedChanges } from "./db";
export type { Note, Space } from "./db";

export { octokit, fetchNotesTree, fetchBlobs } from "./github-api";
export type { GitHubApiError } from "./github-api";
