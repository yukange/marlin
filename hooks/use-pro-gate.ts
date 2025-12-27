/**
 * Pro Feature Gate Hook
 *
 * Manages the upgrade dialog state for non-Pro users trying to access Pro features.
 * Uses zustand for global state management.
 *
 * Usage:
 * ```tsx
 * const { requirePro } = useProGate()
 *
 * <Button onClick={() => requirePro(() => uploadImage())}>
 *   Upload Image
 * </Button>
 * ```
 */
import { create } from "zustand";

import { useStore } from "@/lib/store";

interface ProGateState {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useProGateStore = create<ProGateState>((set) => ({
  isOpen: false,
  openDialog: () => set({ isOpen: true }),
  closeDialog: () => set({ isOpen: false }),
}));

/**
 * Hook to gate Pro features
 *
 * @returns {Object} - { isPro, requirePro }
 * - isPro: boolean - whether user has Pro access
 * - requirePro: (callback: () => void) => void - executes callback if Pro, opens dialog if not
 */
export function useProGate() {
  const isPro = useStore((state) => state.isPro);
  const openDialog = useProGateStore((state) => state.openDialog);

  /**
   * Execute callback if Pro, otherwise open upgrade dialog
   */
  const requirePro = (callback: () => void) => {
    if (isPro) {
      callback();
    } else {
      openDialog();
    }
  };

  return {
    isPro,
    requirePro,
  };
}
