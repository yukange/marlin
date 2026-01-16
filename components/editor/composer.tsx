"use client";

import { EditorContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  ImageIcon,
  FileText,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  useMarlinEditor,
  useComposerState,
  useComposerShortcuts,
  useComposerSubmit,
  useImageUpload,
} from "@/hooks/use-composer";
import { useConfirmDialogStore } from "@/hooks/use-confirm-dialog";
import { useProGate } from "@/hooks/use-pro-gate";
import { cn, getPlatformKey } from "@/lib/utils";

interface ComposerProps {
  space: string;
  initialContent?: string;
  editingNoteId?: string;
  onComplete?: () => void;
}

export function Composer({
  space,
  initialContent,
  editingNoteId,
  onComplete,
}: ComposerProps) {
  const openDialog = useConfirmDialogStore((state) => state.openDialog);
  const { isPro, requirePro } = useProGate();
  const [shortcutKey, setShortcutKey] = useState("");

  useEffect(() => {
    setShortcutKey(getPlatformKey());
  }, []);

  // Composer state management
  const {
    isSending,
    setIsSending,
    isEmpty,
    setIsEmpty,
    isExpanded,
    currentNoteId,
    editorRef,
    reset,
    startNewNote,
    expand,
  } = useComposerState({
    initialContent,
    editingNoteId,
    onSetContent: (content) => setContent(content),
    onFocus: (position) => focus(position),
  });

  // Tiptap editor
  const { editor, getMarkdownContent, setContent, clearContent, focus } =
    useMarlinEditor({
      isExpanded,
      onUpdate: setIsEmpty,
      space,
    });

  // Submit handler
  const { handleSubmit } = useComposerSubmit({
    space,
    getMarkdownContent,
    currentNoteId,
    onSuccess: () => {
      clearContent();
      reset();
      onComplete?.();
    },
  });

  // Image upload (local-first)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { insertLocalImage } = useImageUpload({ space });

  // Insert image as base64 immediately (no network request)
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!isPro) {
        requirePro(() => {});
        return;
      }
      const dataUrl = await insertLocalImage(file);
      if (dataUrl) {
        editor?.chain().focus().setImage({ src: dataUrl }).run();
      }
    },
    [insertLocalImage, editor, isPro, requirePro]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          return;
        }
      }
    },
    [handleImageUpload]
  );

  // Handle send with loading state
  const handleSend = async () => {
    if (!editor || editor.isEmpty || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await handleSubmit();
      // Local save succeeded, close editor
      clearContent();
      reset();
      onComplete?.();
    } catch (error) {
      // Local save failed, keep editor open with content
      console.error("Local save failed:", error);
      // Toast already shown in useNoteMutations
    } finally {
      setIsSending(false);
    }
  };

  const handleEditorClick = () => {
    if (!isExpanded) {
      expand();
      // Use requestAnimationFrame to ensure editor is visible before focusing
      requestAnimationFrame(() => {
        focus();
      });
    }
  };

  const hasUnsavedChanges = () => {
    // Check if there's content in the editor
    return editor && !editor.isEmpty;
  };

  const handleClose = () => {
    if (isSending) {
      return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges()) {
      openDialog({
        title: "Discard Changes?",
        description: currentNoteId
          ? "You have unsaved changes. They will be lost if you close now."
          : "You have unsaved content. It will be lost if you close now.",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
        onConfirm: () => {
          reset();
          clearContent();
          onComplete?.();
        },
      });
      return;
    }

    reset();
    clearContent();
    onComplete?.();
  };

  // Keyboard shortcuts
  useComposerShortcuts({
    isEmpty,
    isSending,
    isExpanded,
    onSend: handleSend,
    onNewNote: () => {
      startNewNote();
      clearContent();
      // Use requestAnimationFrame for smoother focus after state update
      requestAnimationFrame(() => focus());
    },
    onClose: handleClose,
  });

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 md:hidden pointer-events-none"
          aria-label="Backdrop"
        />
      )}

      <section
        ref={editorRef}
        className={cn(
          "transition-all duration-300 ease-out overflow-hidden bg-white dark:bg-zinc-900 rounded-t-2xl flex flex-col relative",
          isExpanded
            ? "h-[400px] border border-b-0 border-zinc-200 dark:border-zinc-800 z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
            : "h-16 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_8px_rgba(0,0,0,0.3)]"
        )}
      >
        {/* Collapsed State Placeholder */}
        {!isExpanded && (
          <button
            className="h-full flex items-center px-6 cursor-text w-full text-left absolute inset-0 z-10"
            onClick={handleEditorClick}
          >
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              New note ({shortcutKey}N)
            </span>
          </button>
        )}

        {/* Expanded State Content - Always mounted but hidden when collapsed to allow immediate focus */}
        <div
          className={cn("flex flex-col h-full w-full", !isExpanded && "hidden")}
        >
          <article
            data-expanded={isExpanded}
            className="composer-scroll-area flex-1 overflow-y-auto [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
          >
            <EditorContent editor={editor} />
          </article>

          {/* Hidden file input for image uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <footer className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 px-4 py-2">
            <nav className="flex gap-1" aria-label="Formatting tools">
              <Toggle
                size="sm"
                pressed={editor?.isActive("bold") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleBold().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor?.isActive("italic") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleItalic().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor?.isActive("strike") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleStrike().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor?.isActive("code") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleCode().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <Code className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor?.isActive("bulletList") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleBulletList().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor?.isActive("orderedList") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor?.isActive("taskList") ?? false}
                onPressedChange={() =>
                  editor?.chain().focus().toggleTaskList().run()
                }
                disabled={!editor}
                className="h-8 w-8"
              >
                <CheckSquare className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={false}
                onPressedChange={() => {
                  requirePro(() => {
                    fileInputRef.current?.click();
                  });
                }}
                disabled={!editor}
                className="h-8 w-8 relative"
              >
                <ImageIcon className="h-4 w-4" />
                {!isPro && (
                  <span className="absolute -top-1 -right-1 rounded-[3px] bg-amber-100 dark:bg-amber-900/40 px-0.5 text-[7px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 leading-none">
                    PRO
                  </span>
                )}
              </Toggle>
              <Toggle
                size="sm"
                pressed={false}
                onPressedChange={() => {
                  requirePro(() => {
                    if (!editor) {
                      return;
                    }

                    // Get current cursor position
                    const { $from } = editor.state.selection;
                    const isAtStartOfLine = $from.parentOffset === 0;
                    const isEmptyDoc = editor.isEmpty;

                    if (isEmptyDoc || isAtStartOfLine) {
                      // Already at start, just insert slash
                      editor.chain().focus().insertContent("/").run();
                    } else {
                      // Move to end of current block, create new paragraph, insert slash
                      // All in one chain so slash command detects startOfLine
                      editor
                        .chain()
                        .focus("end")
                        .splitBlock()
                        .insertContent("/")
                        .run();
                    }
                  });
                }}
                disabled={!editor}
                className="h-8 w-8 relative"
                title="Use template"
              >
                <FileText className="h-4 w-4" />
                {!isPro && (
                  <span className="absolute -top-1 -right-1 rounded-[3px] bg-amber-100 dark:bg-amber-900/40 px-0.5 text-[7px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 leading-none">
                    PRO
                  </span>
                )}
              </Toggle>
            </nav>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-zinc-600 dark:text-zinc-400"
                onClick={handleClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-md bg-[#30CF79] hover:bg-[#2BC06E] text-white font-medium text-xs px-4 transition-colors"
                onClick={handleSend}
                disabled={!editor || isEmpty || isSending}
              >
                {isSending ? (
                  "Sending..."
                ) : (
                  <span>
                    Send{" "}
                    <span className="opacity-80 ml-1 font-normal">
                      {shortcutKey} ↩︎
                    </span>
                  </span>
                )}
              </Button>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
