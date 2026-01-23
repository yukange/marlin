import { useEffect, useRef, useCallback } from "react";

import { useGitHubUser } from "@/hooks/use-github-user";
import { syncWorkspace } from "@/lib/services/sync-service";
import { useStore } from "@/lib/store";
import { REPO_NAME } from "@/lib/services/repo-service";

/**
 * Background Auto-Sync Hook
 *
 * Implements a "Smart Heartbeat Loop" for data synchronization.
 *
 * Features:
 * 1. Global Singleton: Designed to be mounted in the root layout.
 * 2. Mutex Lock: Prevents overlapping syncs.
 * 3. Visibility Guard: Skips/throttles when tab is hidden.
 * 4. Cost Efficiency: Uses Tree SHA to skip unnecessary API calls (304-like).
 * 5. Idle Detection: Avoids syncing while user is typing.
 * 6. Triggers: Interval (60s), Focus, Online.
 * 7. Single-Space: Syncs only the default _marlin space.
 */
export function useAutoSync() {
  const { syncStatus, setSyncStatus } = useStore();
  const { data: user } = useGitHubUser();

  // Refs for state that shouldn't trigger re-renders
  const isSyncingRef = useRef(false);
  const lastSyncedShaRef = useRef<string>("");
  const lastInputTimeRef = useRef(Date.now());

  // Track user activity (Idle Detection)
  useEffect(() => {
    const updateActivity = () => {
      lastInputTimeRef.current = Date.now();
    };

    // Listen to common interaction events
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("click", updateActivity, { passive: true });
    window.addEventListener("mousemove", updateActivity, { passive: true });
    window.addEventListener("touchstart", updateActivity, { passive: true });

    return () => {
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, []);

  // The Core Sync Function
  const runSync = useCallback(
    async (reason: string) => {
      // Basic checks: Must have user and network
      if (!user || !navigator.onLine) {
        return;
      }

      // Mutex Lock: Prevent overlapping syncs (Global loop lock)
      if (isSyncingRef.current) {
        console.log(`[AutoSync] Skipped (${reason}): Already syncing`);
        return;
      }

      // Visibility Guard: If background & interval, skip (save resources)
      if (document.visibilityState === "hidden" && reason === "interval") {
        console.log(`[AutoSync] Skipped (${reason}): App in background`);
        return;
      }

      // Idle Detection: If user typed in last 3s, skip this tick
      if (
        Date.now() - lastInputTimeRef.current < 3000 &&
        reason === "interval"
      ) {
        console.log(`[AutoSync] Skipped (${reason}): User is active`);
        return;
      }

      try {
        isSyncingRef.current = true;

        if (syncStatus !== "syncing") {
          setSyncStatus("syncing");
        }

        let hasError = false;

        // Sync default space
        try {
          const result = await syncWorkspace(
            user.login,
            lastSyncedShaRef.current
          );

          // Update knowledge of remote state
          if (result.latestSha) {
            lastSyncedShaRef.current = result.latestSha;
          }

          if (result.skipped) {
            // console.log(`[AutoSync] Space skipped (SHA match)`)
          } else {
            console.log(
              `[AutoSync] Space synced: +${result.uploaded} -${result.downloaded}`
            );
          }
        } catch (error) {
          console.error(`[AutoSync] Failed to sync space:`, error);
          hasError = true;
        }

        setSyncStatus(hasError ? "error" : "synced");
      } catch (error) {
        console.error(`[AutoSync] Critical failure (${reason}):`, error);
        setSyncStatus("error");
      } finally {
        isSyncingRef.current = false;
      }
    },
    [user, syncStatus, setSyncStatus]
  );

  // 1. Interval Trigger (60s)
  useEffect(() => {
    const timer = setInterval(() => runSync("interval"), 60000);
    return () => clearInterval(timer);
  }, [runSync]);

  // 2. Focus Trigger (Instant update when returning to app)
  useEffect(() => {
    const onFocus = () => runSync("focus");
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [runSync]);

  // 3. Online Trigger (Instant recover from offline)
  useEffect(() => {
    const onOnline = () => {
      console.log("[AutoSync] Network recovered, syncing...");
      runSync("online");
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [runSync]);
}
