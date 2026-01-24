import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NetworkStatus = "online" | "offline";

/** Pro plan types */
export type ProPlan = "monthly" | "yearly" | "lifetime";

interface MarlinState {
  syncStatus: "synced" | "syncing" | "error";
  networkStatus: NetworkStatus;
  isUnauthorized: boolean;
  isRepoInitialized: boolean;
  isPro: boolean;
  proValidatedAt: number | null; // Unix timestamp of last Pro status validation
  proPlan: ProPlan | undefined; // Current Pro plan type

  setSyncStatus: (status: "synced" | "syncing" | "error") => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setIsUnauthorized: (isUnauthorized: boolean) => void;
  setIsRepoInitialized: (isInitialized: boolean) => void;
  setIsPro: (isPro: boolean) => void;
  setProStatus: (isPro: boolean, validatedAt: number, plan?: ProPlan) => void;
}

export const useStore = create<MarlinState>()(
  persist(
    (set) => ({
      syncStatus: "synced",
      networkStatus: "online",
      isUnauthorized: false,
      isRepoInitialized: false,
      isPro: false,
      proValidatedAt: null,
      proPlan: undefined, // No plan

      setSyncStatus: (status) => set({ syncStatus: status }),
      setNetworkStatus: (status) => set({ networkStatus: status }),
      setIsUnauthorized: (isUnauthorized) => set({ isUnauthorized }),
      setIsRepoInitialized: (isInitialized) =>
        set({ isRepoInitialized: isInitialized }),
      setIsPro: (isPro) => set({ isPro }),
      setProStatus: (isPro, validatedAt, plan) =>
        set({ isPro, proValidatedAt: validatedAt, proPlan: plan }),
    }),
    {
      name: "marlin-storage",
    }
  )
);
