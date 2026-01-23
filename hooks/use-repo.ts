import { useQuery } from "@tanstack/react-query";

import { getRepo, initializeRepo } from "@/lib/services/repo-service";

/**
 * Hook to manage the single repository state
 */
export function useRepo() {
  const { data: repo, isLoading, refetch } = useQuery({
    queryKey: ["repo"],
    queryFn: getRepo,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  const initialize = async () => {
    return initializeRepo();
  };

  return {
    repo,
    isLoading,
    isInitialized: !!repo,
    initialize,
    refetch,
  };
}
