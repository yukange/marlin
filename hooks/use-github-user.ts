import { useQuery } from "@tanstack/react-query";

import { getUserProfile } from "@/lib/services/auth-service";

export function useGitHubUser() {
  return useQuery({
    queryKey: ["github-user"],
    queryFn: async () => {
      const user = await getUserProfile();
      return user as { login: string };
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    retryDelay: 1000,
    networkMode: "offlineFirst",
  });
}
