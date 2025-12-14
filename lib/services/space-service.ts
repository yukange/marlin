/**
 * Space Service (Business Layer)
 * 
 * Responsibilities:
 * - List user's spaces (repos ending with .marlin)
 * - Create new spaces
 * - Delete spaces (dangerous operation)
 * - Validate space names
 * 
 * Depends on:
 * - lib/client/github-api.ts
 * - lib/client/db.ts
 */

import { fetchGitHub } from '@/lib/client/github-api';
import { db, type Space } from '@/lib/client/db';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  updated_at: string;
}

// Reserved keywords that cannot be used as space names to prevent routing conflicts
const RESERVED_KEYWORDS = [
  'api',
  'auth',
  'login',
  'new',
  'settings',
  'static',
  'pro',
  'privacy',
  'terms',
  'app',
  'debug',
  '_next',
] as const;

/**
 * Convert space name to repo name by adding .marlin suffix
 * @internal Only for GitHub API calls
 * @example spaceToRepo('work') => 'work.marlin'
 */
export function spaceToRepo(spaceName: string): string {
  return spaceName.endsWith('.marlin') ? spaceName : `${spaceName}.marlin`;
}

/**
 * Convert repo name to space name by removing .marlin suffix
 * @internal Only used in githubRepoToSpace conversion
 * @example repoToSpace('work.marlin') => 'work'
 */
export function repoToSpace(repoName: string): string {
  return repoName.replace(/\.marlin$/, '');
}

/**
 * Convert GitHub repo to Space entity
 * @internal Used during space sync from GitHub
 */
export function githubRepoToSpace(repo: GitHubRepo): Space {
  const spaceName = repoToSpace(repo.name);
  return {
    name: spaceName,
    repoName: repo.name,
    description: repo.description,
    isPrivate: repo.private,
    updatedAt: new Date(repo.updated_at).getTime(),
  };
}

/**
 * Validate space name before creation
 * 
 * Rules:
 * - Not empty
 * - Not a reserved keyword
 * - Only alphanumeric, dots, hyphens, underscores
 * - Max 93 characters (GitHub limit is 100, reserve 7 for ".marlin")
 * 
 * @param name - Proposed space name
 * @returns Validation result with error message if invalid
 */
export function validateSpaceName(name: string): {
  valid: boolean;
  error?: string;
} {
  const trimmedName = name.trim().toLowerCase();
  
  if (!trimmedName) {
    return { valid: false, error: 'Space name is required' };
  }
  
  // Check for reserved keywords
  if (RESERVED_KEYWORDS.includes(trimmedName as any)) {
    return {
      valid: false,
      error: `"${name}" is a reserved keyword and cannot be used as a space name`,
    };
  }
  
  // GitHub repo name validation
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedName)) {
    return {
      valid: false,
      error: 'Space name can only contain letters, numbers, dots, hyphens, and underscores',
    };
  }
  
  if (trimmedName.length > 93) {
    return { valid: false, error: 'Space name must be 93 characters or less' };
  }
  
  return { valid: true };
}

/**
 * Fetch all GitHub repos ending with .marlin
 * 
 * @returns Array of GitHub repo objects
 */
export async function getUserRepos(): Promise<GitHubRepo[]> {
  // Fetch all repos and filter client-side for simplicity in MVP
  // In production, might want to use search API or pagination
  const repos: GitHubRepo[] = await fetchGitHub('user/repos?sort=updated&per_page=100');
  return repos.filter(repo => repo.name.endsWith('.marlin'));
}

/**
 * Fetch user's spaces from GitHub and sync to IndexedDB
 * 
 * This is the primary way to discover spaces.
 * Automatically updates local database for offline access.
 * 
 * @returns Array of Space objects with name as primary key
 */
export async function getUserSpaces(): Promise<Space[]> {
  const repos = await getUserRepos();
  const spaces = repos.map(githubRepoToSpace);
  
  // Sync to Dexie for persistence and offline access
  await Promise.all(spaces.map(space => db.spaces.put(space)));
  
  return spaces;
}

/**
 * Get spaces from local database (offline-first)
 * 
 * @returns Cached spaces from IndexedDB
 */
export async function getLocalSpaces(): Promise<Space[]> {
  return db.spaces.toArray();
}

/**
 * Create a new space on GitHub
 * 
 * Flow:
 * 1. Validate name
 * 2. Create repo on GitHub with .marlin suffix
 * 3. Add to local database
 * 
 * @param name - Space name without .marlin suffix
 * @param description - Optional description
 * @param isPrivate - Whether the repo should be private (default: true)
 * @returns Created space object
 * @throws {Error} If validation fails or GitHub API fails
 */
export async function createSpace(
  name: string,
  description?: string,
  isPrivate = true
): Promise<Space> {
  // Validate space name before creating
  const validation = validateSpaceName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const repoName = spaceToRepo(name);
  
  // Create repo on GitHub
  const repo: GitHubRepo = await fetchGitHub('user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name: repoName,
      description: description || 'Managed by Marlin',
      private: isPrivate,
      auto_init: true,
    }),
  });
  
  // Convert and save to local DB
  const space = githubRepoToSpace(repo);
  await db.spaces.put(space);
  
  return space;
}

/**
 * Delete a space (DANGEROUS)
 * 
 * This will:
 * 1. Delete the GitHub repository
 * 2. Delete all associated notes from local database
 * 3. Remove space from local database
 * 
 * @param name - Space name without .marlin suffix
 * @param owner - Repository owner (GitHub username)
 * @throws {Error} If deletion fails
 */
export async function deleteSpace(name: string, owner: string): Promise<void> {
  const repoName = spaceToRepo(name);
  
  // Delete repo on GitHub
  await fetchGitHub(`repos/${owner}/${repoName}`, {
    method: 'DELETE',
  });
  
  // Clean up local database
  await db.transaction('rw', db.notes, db.spaces, async () => {
    // Delete all notes in this space
    await db.notes.where('space').equals(name).delete();
    
    // Delete space record
    await db.spaces.delete(name);
  });
}
