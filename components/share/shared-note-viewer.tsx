"use client";

import { NoteContent } from "@/components/stream/note-content";

interface SharedNoteViewerProps {
  content: string;
}

export function SharedNoteViewer({ content }: SharedNoteViewerProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 min-h-[50vh]">
      <NoteContent content={content} space="public" />
    </div>
  );
}
