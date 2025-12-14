import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/lib/store'
import { syncWorkspace } from '@/lib/services/sync-service'
import { useGitHubUser } from '@/hooks/use-github-user'

/**
 * Hook to sync a space with GitHub
 * @param space - Space name without .marlin suffix (e.g., "work")
 */
export function useSync(space: string) {
  const { setSyncStatus } = useStore()
  const { data: user } = useGitHubUser()
  const abortControllerRef = useRef<AbortController | null>(null)

  const sync = useCallback(async () => {
    if (!space || !user) return

    // Cancel previous sync
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setSyncStatus('syncing')
      
      // Use centralized sync engine
      await syncWorkspace(space, user.login)

      if (!controller.signal.aborted) {
        setSyncStatus('synced')
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      console.error('Sync failed:', error)
      setSyncStatus('error')
    }
  }, [space, user, setSyncStatus])

  useEffect(() => {
    sync()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [sync])

  return { sync }
}
