import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/client/db'
import { getUserSpaces } from '@/lib/services/space-service'

/**
 * Hook to fetch and sync spaces from GitHub to local database
 * 
 * Flow:
 * 1. Fetch from GitHub via React Query (cached)
 * 2. React Query automatically syncs to Dexie via getUserSpaces
 * 3. Read from Dexie for reactive local-first updates
 * 
 * @returns {Space[] | undefined} Array of spaces or undefined during loading
 */
export function useSpaces() {
  // Fetch from API and sync to Dexie
  const { data: apiSpaces, isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: getUserSpaces,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  // Read from Dexie for reactive updates
  const dexieSpaces = useLiveQuery(
    () => db.spaces.orderBy('updatedAt').reverse().toArray(),
    []
  )

  // Use Dexie data if available, fallback to API data
  const spaces = dexieSpaces || apiSpaces

  return { spaces, isLoading }
}
