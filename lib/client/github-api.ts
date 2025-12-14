/**
 * GitHub API Client (Infrastructure Layer)
 * 
 * Responsibilities:
 * - Raw HTTP communication with GitHub via /api/proxy
 * - Error handling and response parsing
 * - NO business logic
 * 
 * This is the ONLY place where fetch() calls to GitHub should happen.
 */

import { useStore } from "@/lib/store";

export interface GitHubApiError extends Error {
  status?: number;
  statusText?: string;
}

/**
 * Fetch data from GitHub API through the proxy endpoint
 * 
 * @param path - GitHub API path (e.g., "user/repos", "repos/owner/repo/contents/file")
 * @param options - Standard fetch options (method, headers, body)
 * @returns Parsed JSON response
 * @throws {GitHubApiError} If the request fails
 * 
 * @example
 * const repos = await fetchGitHub('user/repos?sort=updated&per_page=100')
 * 
 * @example
 * await fetchGitHub('repos/owner/repo/contents/notes/123.md', {
 *   method: 'PUT',
 *   body: JSON.stringify({ message: 'Update', content: base64, sha })
 * })
 */
export async function fetchGitHub<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  const res = await fetch(`/api/proxy/${cleanPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      useStore.getState().setIsUnauthorized(true);
    }

    const error = new Error(
      `GitHub API error: ${res.status} ${res.statusText}`
    ) as GitHubApiError;
    error.status = res.status;
    error.statusText = res.statusText;
    throw error;
  }
  
  return res.json();
}


/**
 * Create or update a file in GitHub
 * 
 * @param owner - Repository owner
 * @param repo - Repository name (with .marlin suffix)
 * @param path - File path (e.g., "notes/123.md")
 * @param content - Base64-encoded content
 * @param message - Commit message
 * @param sha - Existing file SHA (for updates, undefined for creates)
 * @returns Response with new SHA
 */
export async function putFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<{ content: { sha: string } }> {
  return fetchGitHub(`repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content,
      sha,
    }),
  });
}

/**
 * Execute a GraphQL query against the GitHub API
 */
export async function fetchGraphQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const res = await fetch('/api/proxy/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      useStore.getState().setIsUnauthorized(true);
    }
    
    const error = new Error(
      `GitHub GraphQL error: ${res.status} ${res.statusText}`
    ) as GitHubApiError;
    error.status = res.status;
    error.statusText = res.statusText;
    throw error;
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL Error: ${json.errors[0]?.message || JSON.stringify(json.errors)}`);
  }
  
  return json.data;
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
    const data = await fetchGraphQL(query, { owner, repo });
    return data.repository?.object?.oid || null;
  } catch (error) {
    console.error('Failed to fetch remote tree SHA:', error);
    return null;
  }
}

/**
 * Fetch notes tree using GraphQL (HEAD:notes)
 */
export async function fetchNotesTree(
  owner: string,
  repo: string
): Promise<Array<{ path: string; sha: string; type: 'blob' }>> {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: "HEAD:notes") {
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

  const data = await fetchGraphQL(query, { owner, repo });
  const entries = data.repository?.object?.entries || [];
  
  return entries
    .filter((e: any) => e.type === 'blob' && e.name.endsWith('.md'))
    .map((e: any) => ({
      path: `notes/${e.name}`,
      sha: e.oid,
      type: 'blob' as const,
    }));
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

  const data = await fetchGraphQL(query, { owner, repo });
  const result: Record<string, string> = {};

  if (data.repository) {
    for (const [alias, content] of Object.entries(data.repository)) {
      const sha = aliasMap.get(alias);
      if (sha && (content as any)?.text) {
        result[sha] = (content as any).text;
      }
    }
  }

  return result;
}
