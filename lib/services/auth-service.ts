/**
 * Authentication Service (Business Layer)
 * 
 * Responsibilities:
 * - Fetch authenticated user profile
 * - Check API rate limits
 * - Future: License validation (Pro status)
 * 
 * Depends on:
 * - lib/client/github-api.ts
 */

import { octokit } from '@/lib/client/github-api';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}

/**
 * Get authenticated user profile
 * 
 * @returns User profile data
 * @throws {GitHubApiError} If not authenticated or API fails
 */
export async function getUserProfile(): Promise<GitHubUser> {
  const { data } = await octokit.rest.users.getAuthenticated();
  return data as GitHubUser;
}

/**
 * Get GitHub API rate limit status
 * 
 * @returns Rate limit information for current user
 */
export async function getRateLimit(): Promise<RateLimit> {
  const { data } = await octokit.rest.rateLimit.get();
  return data.resources.core;
}

/**
 * Check if user is authenticated
 * 
 * @returns true if user can access GitHub API
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getUserProfile();
    return true;
  } catch {
    return false;
  }
}

/**
 * Future: Check license status (Pro/Free)
 * 
 * This will integrate with Cloudflare KV or external license validation service.
 * For now, returns placeholder.
 */
export async function checkLicenseStatus(): Promise<{
  isPro: boolean;
  expiresAt?: number;
}> {
  // TODO: Implement license checking via Cloudflare KV
  return {
    isPro: false,
  };
}
