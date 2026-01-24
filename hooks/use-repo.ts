import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { getRepo, initializeRepo } from "@/lib/services/repo-service";
import { useStore } from "@/lib/store";

/**
 * Hook to manage the single repository state
 */
export function useRepo() {
  const { isRepoInitialized, setIsRepoInitialized } = useStore();

  const {
    data: repo,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["repo"],
    queryFn: getRepo,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  useEffect(() => {
    if (repo) {
      setIsRepoInitialized(true);
    }
  }, [repo, setIsRepoInitialized]);

  const initialize = async () => {
    const result = await initializeRepo();
    if (result.repo) {
      setIsRepoInitialized(true);
    }
    return result;
  };

  return {
    repo,
    isLoading,
    isInitialized: isRepoInitialized || !!repo,
    initialize,
    refetch,
  };
}
