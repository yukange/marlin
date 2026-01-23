import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NetworkStatus = "online" | "limited" | "offline";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/** Pro plan types */
export type ProPlan = "monthly" | "yearly" | "lifetime";

interface MarlinState {
  syncStatus: "synced" | "syncing" | "error";
  networkStatus: NetworkStatus;
  rateLimitInfo: RateLimitInfo | null;
  isUnauthorized: boolean;
  isPro: boolean;
  proValidatedAt: number | null; // Unix timestamp of last Pro status validation
  proPlan: ProPlan | undefined; // Current Pro plan type

  setSyncStatus: (status: "synced" | "syncing" | "error") => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setRateLimitInfo: (info: RateLimitInfo | null) => void;
  setIsUnauthorized: (isUnauthorized: boolean) => void;
  setIsPro: (isPro: boolean) => void;
  setProStatus: (isPro: boolean, validatedAt: number, plan?: ProPlan) => void;
}

export const useStore = create<MarlinState>()(
  persist(
    (set) => ({
      syncStatus: "synced",
      networkStatus: "online",
      rateLimitInfo: null,
      isUnauthorized: false,
      isPro: false,
      proValidatedAt: null,
      proPlan: undefined, // No plan

      setSyncStatus: (status) => set({ syncStatus: status }),
      setNetworkStatus: (status) => set({ networkStatus: status }),
      setRateLimitInfo: (info) => set({ rateLimitInfo: info }),
      setIsUnauthorized: (isUnauthorized) => set({ isUnauthorized }),
      setIsPro: (isPro) => set({ isPro }),
      setProStatus: (isPro, validatedAt, plan) =>
        set({ isPro, proValidatedAt: validatedAt, proPlan: plan }),
    }),
    {
      name: "marlin-storage",
    }
  )
);
