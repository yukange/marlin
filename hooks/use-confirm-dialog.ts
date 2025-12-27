"use client";

import { create } from "zustand";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "destructive";
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface ConfirmDialogStore extends ConfirmDialogState {
  openDialog: (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeDialog: () => void;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogStore>((set, get) => ({
  isOpen: false,
  title: "",
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
  onConfirm: null,
  onCancel: null,

  openDialog: (options) => {
    set({
      isOpen: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || "Confirm",
      cancelText: options.cancelText || "Cancel",
      variant: options.variant || "default",
      onConfirm: options.onConfirm,
      onCancel: options.onCancel || null,
    });
  },

  closeDialog: () => {
    set({
      isOpen: false,
      onConfirm: null,
      onCancel: null,
    });
  },

  confirm: () => {
    const { onConfirm } = get();
    onConfirm?.();
    get().closeDialog();
  },

  cancel: () => {
    const { onCancel } = get();
    onCancel?.();
    get().closeDialog();
  },
}));

export function useConfirmDialog() {
  const openDialog = useConfirmDialogStore((state) => state.openDialog);

  return {
    confirm: (options: Parameters<typeof openDialog>[0]) => {
      return new Promise<boolean>((resolve) => {
        openDialog({
          ...options,
          onConfirm: () => {
            options.onConfirm?.();
            resolve(true);
          },
          onCancel: () => {
            options.onCancel?.();
            resolve(false);
          },
        });
      });
    },
  };
}
