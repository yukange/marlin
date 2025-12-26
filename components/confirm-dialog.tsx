"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirmDialogStore } from "@/hooks/use-confirm-dialog";

export function ConfirmDialog() {
  const {
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    variant,
    confirm,
    cancel,
  } = useConfirmDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && cancel()}>
      <DialogContent className="max-w-[min(90vw,380px)] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-6 gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            onClick={confirm}
            className={`rounded-full w-full sm:w-auto sm:min-w-[100px] font-medium ${
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={cancel}
            className="rounded-full w-full sm:w-auto sm:min-w-[100px] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
