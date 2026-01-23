import { useEffect, useCallback, useRef } from "react";

import { useGitHubUser } from "@/hooks/use-github-user";
import { syncWorkspace } from "@/lib/services/sync-service";
import { useStore } from "@/lib/store";

/**
 * Hook to sync the default workspace with GitHub
 */
export function useSync() {
  const { setSyncStatus } = useStore();
  const { data: user } = useGitHubUser();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sync = useCallback(async () => {
    if (!user) {
      return;
    }

    // Cancel previous sync
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setSyncStatus("syncing");

      // Use centralized sync engine (no space param)
      await syncWorkspace(user.login);

      if (!controller.signal.aborted) {
        setSyncStatus("synced");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      console.error("Sync failed:", error);
      setSyncStatus("error");
    }
  }, [user, setSyncStatus]);

  useEffect(() => {
    sync();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sync]);

  return { sync };
}
