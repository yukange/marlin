"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { useNoteMutations } from "@/hooks/use-composer";
import { useConfirmDialogStore } from "@/hooks/use-confirm-dialog";
import { useNotes } from "@/hooks/use-notes";
import { type Note } from "@/lib/client/db";

import { NoteCard } from "./note-card";

interface NoteStreamProps {
  searchQuery?: string;
  filterDate?: string;
  filterTemplates?: boolean;
  onEditNote?: (content: string, noteId: string) => void;
  onTagClick?: (tag: string) => void;
  onVisibleDateChange?: (date: string | null) => void; // Report which date is visible
  isInTrash?: boolean;
}

export function NoteStream({
  searchQuery = "",
  filterDate = "",
  filterTemplates = false,
  onEditNote,
  onTagClick,
  onVisibleDateChange,
  isInTrash = false,
}: NoteStreamProps) {
  const notes = useNotes(
    searchQuery,
    filterDate,
    isInTrash,
    filterTemplates
  );
  const {
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    retrySync,
    toggleTemplate,
  } = useNoteMutations();
  const openDialog = useConfirmDialogStore((state) => state.openDialog);
  const containerRef = useRef<HTMLElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  
  // Flag to skip visibility detection during programmatic scroll
  const isProgrammaticScroll = useRef(false);

  // Scroll to bottom when new note is created (listen for custom event from Composer)
  useEffect(() => {
    const handleNoteCreated = () => {
      const container = containerRef.current;
      const scrollContainer = container?.parentElement;
      if (!container || !scrollContainer) {
        return;
      }

      // Wait for the new note to be rendered, then scroll to bottom
      const observer = new MutationObserver(() => {
        observer.disconnect();
        if (bottomAnchorRef.current) {
          isProgrammaticScroll.current = true;
          bottomAnchorRef.current.scrollIntoView({ behavior: "smooth" });
          // Reset flag after scroll completes
          scrollContainer.addEventListener("scrollend", () => {
            isProgrammaticScroll.current = false;
          }, { once: true });
        }
      });

      observer.observe(container, { childList: true });
    };

    window.addEventListener("note:created", handleNoteCreated);
    return () => window.removeEventListener("note:created", handleNoteCreated);
  }, []);

  // Listen for navigation event from CalendarBar
  useEffect(() => {
    const handleScrollToDate = (event: CustomEvent<string>) => {
      const targetDate = event.detail;
      if (!targetDate || !containerRef.current) {
        return;
      }

      // Find all notes with matching date
      const noteElements = containerRef.current.querySelectorAll(
        `[data-date="${targetDate}"]`
      );
      
      if (noteElements.length > 0) {
        // In flex-col-reverse, the LAST DOM element is the FIRST (oldest) note visually (at top)
        const firstNoteOfDate = noteElements[noteElements.length - 1];
        
        isProgrammaticScroll.current = true;
        
        const scrollContainer = containerRef.current.parentElement;
        if (scrollContainer) {
          firstNoteOfDate.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          // Reset flag and update visible date after scroll completes
          scrollContainer.addEventListener("scrollend", () => {
            isProgrammaticScroll.current = false;
            // Manually update visible date since IntersectionObserver skipped during scroll
            onVisibleDateChange?.(targetDate);
          }, { once: true });
        }
      }
    };

    window.addEventListener("calendar:scrollToDate", handleScrollToDate as EventListener);
    return () => window.removeEventListener("calendar:scrollToDate", handleScrollToDate as EventListener);
  }, [onVisibleDateChange]);

  // IntersectionObserver to detect visible notes and report to parent
  useEffect(() => {
    if (!containerRef.current || !onVisibleDateChange) {
      return;
    }

    const scrollContainer = containerRef.current.parentElement;
    if (!scrollContainer) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Skip during programmatic scroll
        if (isProgrammaticScroll.current) {
          return;
        }

        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length === 0) {
          return;
        }

        const container = containerRef.current;
        if (!container) {
          return;
        }

        // Find the topmost visible note
        // Since notes are ordered from oldest to newest, the topmost is the first to enter viewport
        const noteElements = container.querySelectorAll("[data-date]");
        const scrollRect = scrollContainer.getBoundingClientRect();
        
        let topmostDate: string | null = null;
        let topmostTop = Infinity;

        noteElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Check if element is in viewport
          if (rect.top < scrollRect.bottom && rect.bottom > scrollRect.top) {
            const date = el.getAttribute("data-date");
            if (date && rect.top < topmostTop) {
              topmostDate = date;
              topmostTop = rect.top;
            }
          }
        });

        if (topmostDate) {
          onVisibleDateChange(topmostDate);
        }
      },
      {
        root: scrollContainer,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "0px",
      }
    );

    // Observe all note cards
    const noteElements = containerRef.current.querySelectorAll("[data-date]");
    noteElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [notes, onVisibleDateChange]);

  const handleEdit = (note: Note) => {
    onEditNote?.(note.content, note.id);
  };

  const handleRetrySync = async (note: Note) => {
    await retrySync(note.id);
  };

  const handleDelete = async (note: Note) => {
    await deleteNote(note.id);
  };

  const handleRestore = async (note: Note) => {
    await restoreNote(note.id);
  };

  const handleToggleTemplate = async (note: Note) => {
    await toggleTemplate(note.id, !note.isTemplate);
  };

  const handlePermanentDelete = async (note: Note) => {
    openDialog({
      title: "Delete Forever?",
      description:
        "This note will be permanently deleted from GitHub and cannot be recovered.",
      confirmText: "Delete Forever",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        await permanentDeleteNote(note.id);
      },
    });
  };

  if (!notes) {
    return null;
  }
  if (notes.length === 0) {
    if (isInTrash) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
          <Trash2 className="h-8 w-8 mb-2 opacity-50" />
          <p>Trash is empty</p>
        </div>
      );
    }
    // Only show empty state if not filtering (to avoid showing "No notes" when search yields nothing if we want different UI for search)
    // But for now, simple empty is fine.
    if (!searchQuery && !filterDate) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
          <p>No notes yet</p>
        </div>
      );
    }
  }

  return (
    <section ref={containerRef} className="flex flex-col-reverse min-h-0 gap-3">
      {/* Anchor at DOM first position = visual bottom for scrollIntoView */}
      <div ref={bottomAnchorRef} aria-hidden="true" />
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onRetrySync={handleRetrySync}
          onTagClick={onTagClick || (() => {})}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onToggleTemplate={handleToggleTemplate}
          highlight={searchQuery}
          isInTrash={isInTrash}
        />
      ))}
    </section>
  );
}
