import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NetworkStatus = 'online' | 'limited' | 'offline'

interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

interface MarlinState {
  currentSpace: string | null
  lastActiveSpace: string | null
  syncStatus: 'synced' | 'syncing' | 'error'
  spacesSyncState: Record<string, 'synced' | 'syncing' | 'error'>
  networkStatus: NetworkStatus
  rateLimitInfo: RateLimitInfo | null
  isUnauthorized: boolean
  setCurrentSpace: (space: string) => void
  setLastActiveSpace: (space: string) => void
  setSyncStatus: (status: 'synced' | 'syncing' | 'error') => void
  setSpaceSyncStatus: (space: string, status: 'synced' | 'syncing' | 'error') => void
  setNetworkStatus: (status: NetworkStatus) => void
  setRateLimitInfo: (info: RateLimitInfo | null) => void
  setIsUnauthorized: (isUnauthorized: boolean) => void
}

export const useStore = create<MarlinState>()(
  persist(
    (set) => ({
      currentSpace: null,
      lastActiveSpace: null,
      syncStatus: 'synced',
      spacesSyncState: {},
      networkStatus: 'online',
      rateLimitInfo: null,
      isUnauthorized: false,
      setCurrentSpace: (space) => {
        set({ currentSpace: space, lastActiveSpace: space })
      },
      setLastActiveSpace: (space) => set({ lastActiveSpace: space }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      setSpaceSyncStatus: (space, status) => 
        set((state) => ({ 
          spacesSyncState: { ...state.spacesSyncState, [space]: status } 
        })),
      setNetworkStatus: (status) => set({ networkStatus: status }),
      setRateLimitInfo: (info) => set({ rateLimitInfo: info }),
      setIsUnauthorized: (isUnauthorized) => set({ isUnauthorized }),
    }),
    {
      name: 'marlin-storage',
      partialize: (state) => ({ lastActiveSpace: state.lastActiveSpace }),
    }
  )
)
