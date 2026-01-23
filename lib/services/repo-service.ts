/**
 * Repository Service (Business Layer)
 *
 * Responsibilities:
 * - Manage the single "_marlin" GitHub repository
 * - Initialize the repo if missing
 *
 * Depends on:
 * - lib/client/github-api.ts
 */

import { octokit } from "@/lib/client/github-api";
import { isErrorWithStatus } from "@/lib/utils/type-guards";

export const REPO_NAME = "_marlin";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  updated_at: string;
  owner: {
    login: string;
  };
}

// GitHub Actions workflow content for cleaning up orphan images
const CLEANUP_WORKFLOW_CONTENT = `name: Cleanup Orphan Images

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Find and delete orphan images
        run: |
          # Extract all referenced images from notes frontmatter
          REFERENCED_IMAGES=$(grep -rh "^images:" notes/ 2>/dev/null | \\
            sed 's/images: \\[//' | sed 's/\\]//' | \\
            tr ',' '\\n' | tr -d ' "' | sort -u || echo "")
          
          # List all images in images/ directory
          if [ -d "images" ]; then
            for img in images/*; do
              filename=$(basename "$img")
              if ! echo "$REFERENCED_IMAGES" | grep -qx "$filename"; then
                echo "Deleting orphan image: $filename"
                rm "$img"
              fi
            done
          fi
      
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git diff --staged --quiet || git commit -m "chore: cleanup orphan images"
          git push || true
`;

/**
 * Check if the repository exists on GitHub
 */
export async function getRepo(): Promise<GitHubRepo | null> {
  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const { data: repo } = await octokit.rest.repos.get({
      owner: user.login,
      repo: REPO_NAME,
    });
    return repo as GitHubRepo;
  } catch (error) {
    if (isErrorWithStatus(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Initialize the default repository on GitHub
 */
export async function initializeRepo(
  description: string = "Marlin Notes",
  isPrivate: boolean = true
): Promise<{ repo: GitHubRepo; created: boolean }> {
  let repo: GitHubRepo;
  let created = false;

  try {
    // Try to create repo on GitHub
    const { data } = await octokit.rest.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      description,
      private: isPrivate,
      auto_init: true,
    });
    repo = data as GitHubRepo;
    created = true;
  } catch (error: unknown) {
    // If repo already exists (422), try to fetch it
    if (isErrorWithStatus(error) && error.status === 422) {
      console.log(`Repository ${REPO_NAME} already exists, fetching details...`);
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const { data: existingRepo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: REPO_NAME,
      });
      repo = existingRepo as GitHubRepo;
      created = false;
    } else {
      throw error;
    }
  }

  // Initialize cleanup workflow for orphan images
  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo.owner.login,
      repo: REPO_NAME,
      path: ".github/workflows/cleanup-images.yml",
      message: "Add image cleanup workflow",
      content: Buffer.from(CLEANUP_WORKFLOW_CONTENT).toString("base64"),
    });
  } catch (error) {
    console.log("Cleanup workflow setup skipped or failed:", error);
  }

  return { repo, created };
}
