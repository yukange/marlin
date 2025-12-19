/**
 * GitHub API Client (Infrastructure Layer)
 * 
 * Responsibilities:
 * - Raw HTTP communication with GitHub via Octokit (proxied via /api/proxy)
 * - Error handling and response parsing
 * - NO business logic
 * 
 * This is the ONLY place where GitHub API calls should happen.
 */

import { useStore } from "@/lib/store";
import { Octokit } from "octokit";

export interface GitHubApiError extends Error {
  status?: number;
  statusText?: string;
}

// Initialize Octokit pointing to our local proxy
export const octokit = new Octokit({
  baseUrl: "/api/proxy",
});

// Hook to handle unauthorized errors globally
octokit.hook.after("request", async (response, _options) => {
  if (response.status === 401) {
    useStore.getState().setIsUnauthorized(true);
  }
});

octokit.hook.error("request", async (error, _options) => {
  if ('status' in error && error.status === 401) {
    useStore.getState().setIsUnauthorized(true);
  }
  throw error;
});

// GraphQL Interfaces
interface TreeEntry {
  name: string;
  type: string;
  oid: string;
}

interface TreeObject {
  entries: TreeEntry[];
}

interface BlobObject {
  text: string;
}

interface RepositoryQuery {
  repository: {
    object?: {
      oid: string;
    };
    notesTree?: TreeObject;
    trashTree?: TreeObject;
    [key: string]: BlobObject | TreeObject | { oid: string } | undefined;
  };
}

/**
 * Fetch notes tree using GraphQL (HEAD:notes)
 */
export async function fetchRemoteTreeSha(
  owner: string,
  repo: string
): Promise<string | null> {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: "HEAD:notes") {
          ... on Tree {
            oid
          }
        }
      }
    }
  `;

  try {
    const data = await octokit.graphql<RepositoryQuery>(query, { owner, repo });
    return data.repository?.object?.oid || null;
  } catch (error) {
    console.error('Failed to fetch remote tree SHA:', error);
    return null;
  }
}

/**
 * Fetch notes tree using GraphQL (HEAD:notes and HEAD:.trash)
 */
export async function fetchNotesTree(
  owner: string,
  repo: string
): Promise<Array<{ path: string; sha: string; type: 'blob' }>> {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        notesTree: object(expression: "HEAD:notes") {
          ... on Tree {
            entries {
              name
              type
              oid
            }
          }
        }
        trashTree: object(expression: "HEAD:.trash") {
          ... on Tree {
            entries {
              name
              type
              oid
            }
          }
        }
      }
    }
  `;

  try {
    const data = await octokit.graphql<RepositoryQuery>(query, { owner, repo });

    // Check for GraphQL errors (repository not found)
    // GraphQL may return 200 but include errors array
    if ('errors' in data && Array.isArray(data.errors)) {
      const notFoundError = (data.errors as any[]).find(
        (err: any) => err.type === 'NOT_FOUND'
      );
      if (notFoundError) {
        const error = new Error('Repository not found') as GitHubApiError;
        error.status = 404;
        throw error;
      }
    }

    const results: Array<{ path: string; sha: string; type: 'blob' }> = [];

    // Process notes/ directory
    const notesEntries = data.repository?.notesTree?.entries || [];
    notesEntries.forEach((e) => {
      if (e.type === 'blob' && e.name.endsWith('.md')) {
        results.push({
          path: `notes/${e.name}`,
          sha: e.oid,
          type: 'blob',
        });
      }
    });

    // Process .trash/ directory
    const trashEntries = data.repository?.trashTree?.entries || [];
    trashEntries.forEach((e) => {
      if (e.type === 'blob' && e.name.endsWith('.md')) {
        results.push({
          path: `.trash/${e.name}`,
          sha: e.oid,
          type: 'blob',
        });
      }
    });

    return results;
  } catch (error: unknown) {
    // Re-throw with proper error type
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw error;
  }
}

/**
 * Batch fetch blobs using GraphQL
 */
export async function fetchBlobs(
  owner: string,
  repo: string,
  shas: string[]
): Promise<Record<string, string>> {
  if (shas.length === 0) return {};

  // GraphQL aliases must be alphanumeric
  const aliasMap = new Map<string, string>();
  const queryParts: string[] = [];

  shas.forEach((sha, index) => {
    const alias = `blob_${index}`;
    aliasMap.set(alias, sha);
    queryParts.push(`${alias}: object(oid: "${sha}") { ... on Blob { text } }`);
  });

  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${queryParts.join('\n')}
      }
    }
  `;

  const data = await octokit.graphql<RepositoryQuery>(query, { owner, repo });
  const result: Record<string, string> = {};

  if (data.repository) {
    for (const [alias, content] of Object.entries(data.repository)) {
      const sha = aliasMap.get(alias);
      if (sha && content && 'text' in content) {
        result[sha] = (content as BlobObject).text;
      }
    }
  }

  return result;
}