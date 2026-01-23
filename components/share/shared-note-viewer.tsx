"use client";

import { NoteContent } from "@/components/stream/note-content";

interface SharedNoteViewerProps {
  content: string;
}

export function SharedNoteViewer({ content }: SharedNoteViewerProps) {
  return (
    <article className="max-w-2xl mx-auto py-12 px-6">
      <NoteContent content={content} />
    </article>
  );
}
