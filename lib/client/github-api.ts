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

import { Octokit } from "octokit";

import { useStore } from "@/lib/store";

export interface GitHubApiError extends Error {
  status?: number;
  statusText?: string;
}

// Initialize Octokit pointing to our local proxy
export const octokit = new Octokit({
  baseUrl: "/api/proxy",
});

// Hook to handle unauthorized errors globally
octokit.hook.after("request", async (response) => {
  if (response.status === 401) {
    useStore.getState().setIsUnauthorized(true);
  }
});

octokit.hook.error("request", async (error) => {
  if ("status" in error && error.status === 401) {
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
    console.error("Failed to fetch remote tree SHA:", error);
    return null;
  }
}

/**
 * Fetch notes tree using GraphQL (HEAD:notes and HEAD:.trash)
 */
export async function fetchNotesTree(
  owner: string,
  repo: string
): Promise<Array<{ path: string; sha: string; type: "blob" }>> {
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
    if ("errors" in data && Array.isArray(data.errors)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GraphQL error type not exposed
      const notFoundError = (data.errors as any[]).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GraphQL error type not exposed
        (err: any) => err.type === "NOT_FOUND"
      );
      if (notFoundError) {
        const error = new Error("Repository not found") as GitHubApiError;
        error.status = 404;
        throw error;
      }
    }

    const results: Array<{ path: string; sha: string; type: "blob" }> = [];

    // Process notes/ directory
    const notesEntries = data.repository?.notesTree?.entries || [];
    notesEntries.forEach((e) => {
      if (e.type === "blob" && e.name.endsWith(".md")) {
        results.push({
          path: `notes/${e.name}`,
          sha: e.oid,
          type: "blob",
        });
      }
    });

    // Process .trash/ directory
    const trashEntries = data.repository?.trashTree?.entries || [];
    trashEntries.forEach((e) => {
      if (e.type === "blob" && e.name.endsWith(".md")) {
        results.push({
          path: `.trash/${e.name}`,
          sha: e.oid,
          type: "blob",
        });
      }
    });

    return results;
  } catch (error: unknown) {
    // GraphqlResponseError: Check if repository not found
    if (error instanceof Error) {
      const message = error.message || "";
      // GraphQL throws "Could not resolve to a Repository" when repo doesn't exist
      if (
        message.includes("Could not resolve to a Repository") ||
        message.includes("NOT_FOUND")
      ) {
        const notFoundError = new Error(
          "Repository not found"
        ) as GitHubApiError;
        notFoundError.status = 404;
        throw notFoundError;
      }
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
  if (shas.length === 0) {
    return {};
  }

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
        ${queryParts.join("\n")}
      }
    }
  `;

  const data = await octokit.graphql<RepositoryQuery>(query, { owner, repo });
  const result: Record<string, string> = {};

  if (data.repository) {
    for (const [alias, content] of Object.entries(data.repository)) {
      const sha = aliasMap.get(alias);
      if (sha && content && "text" in content) {
        result[sha] = (content as BlobObject).text;
      }
    }
  }

  return result;
}

/**
 * Create or update a file in the repository
 */
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
): Promise<void> {
  let sha: string | undefined;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(data) && "sha" in data) {
      sha = data.sha;
    }
  } catch (error: unknown) {
    if ((error as GitHubApiError).status !== 404) {
      throw error;
    }
    // File doesn't exist, proceed with creation
  }

  // Convert content to Base64 (handle Unicode)
  const contentBase64 = btoa(unescape(encodeURIComponent(content)));

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: contentBase64,
    sha,
  });
}

/**
 * Delete a file from the repository
 */
export async function deleteFile(
  owner: string,
  repo: string,
  path: string,
  message: string
): Promise<void> {
  let sha: string;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || !("sha" in data)) {
      throw new Error("Path is not a file");
    }
    sha = data.sha;
  } catch (error: unknown) {
    if ((error as GitHubApiError).status === 404) {
      return; // File already gone
    }
    throw error;
  }

  await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
  });
}

/**
 * Get raw file content
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || !("content" in data)) {
      return null;
    }

    const content = data.content;
    const encoding = data.encoding;

    if (encoding === "base64") {
      return decodeURIComponent(escape(atob(content)));
    }

    return content;
  } catch (error: unknown) {
    if ((error as GitHubApiError).status === 404) {
      return null;
    }
    throw error;
  }
}
