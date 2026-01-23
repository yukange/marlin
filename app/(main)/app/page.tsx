"use client";

import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState, useRef, Suspense } from "react";
import { toast } from "sonner";

import { CalendarBar } from "@/components/layout/calendar-bar";
import { SpaceHeader } from "@/components/layout/space-header";
import { NoteStream } from "@/components/stream/note-stream";
import { Button } from "@/components/ui/button";
import { useRepo } from "@/hooks/use-repo";
import { useSync } from "@/hooks/use-sync";
import { REPO_NAME } from "@/lib/services/repo-service";
import { useStore } from "@/lib/store";

const Composer = dynamic(
  () => import("@/components/editor/composer").then((mod) => mod.Composer),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 w-full p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="h-10 w-full max-w-3xl rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    ),
  }
);

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isUnauthorized } = useStore();
  const { isLoading, isInitialized, initialize } = useRepo();
  const [isCreating, setIsCreating] = useState(false);
  const initializingRef = useRef(false);

  // State for NoteStream & Composer
  const searchQuery = searchParams.get("q") || "";
  const filterDate = searchParams.get("date") || "";
  const filterTemplates = searchParams.get("filter") === "templates";
  const [editContent, setEditContent] = useState<string>();
  const [editingNoteId, setEditingNoteId] = useState<string>();
  const [visibleDate, setVisibleDate] = useState<string | null>(null);

  // Sync hook (auto-runs)
  useSync();

  // Initialization Logic
  useEffect(() => {
    if (isUnauthorized) {
      return;
    }

    const initSpace = async () => {
      if (!isLoading && !isInitialized) {
        // Check ref to prevent double execution
        if (initializingRef.current) {
          return;
        }

        try {
          initializingRef.current = true;
          setIsCreating(true);
          const { created } = await initialize();
          if (created) {
            toast.success("Marlin initialized successfully");
          }
        } catch (error) {
          console.error("Failed to initialize:", error);
          initializingRef.current = false;
          setIsCreating(false);
          toast.error("Failed to initialize. Please try refreshing.");
        }
      }
    };

    initSpace();
  }, [isLoading, isInitialized, isUnauthorized, initialize]);

  const handleEditNote = (content: string, noteId: string) => {
    setEditContent(content);
    setEditingNoteId(noteId);
  };

  const handleEditComplete = () => {
    setEditContent(undefined);
    setEditingNoteId(undefined);
  };

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQuery = params.get("q");
    const targetQuery = `#${tag}`;

    if (currentQuery === targetQuery) {
      params.delete("q");
    } else {
      params.set("q", targetQuery);
    }

    router.push(`/app?${params.toString()}`, { scroll: false });
  };

  // Loading / Error States
  if (isUnauthorized) {
    return (
      <main className="grid place-items-center h-screen">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Session Expired
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your GitHub connection has expired. Please sign in again to
            continue.
          </p>
          <Button
            onClick={() => signIn("github")}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
          >
            Reconnect with GitHub
          </Button>
        </div>
      </main>
    );
  }

  if (isLoading || isCreating || !isInitialized) {
    return (
      <main className="grid place-items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          {(isCreating || !isInitialized) && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Initializing your private space...
            </p>
          )}
        </div>
      </main>
    );
  }

  // Main App Content
  return (
    <main className="h-[calc(100vh-3.5rem)] md:h-screen dark:bg-zinc-950 flex overflow-hidden">
      {/* Left column: Header + NoteStream + Composer */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-3 pr-4">
        <SpaceHeader />
        <div className="relative flex-1 min-h-0 overflow-hidden mt-4">
          <article
            data-note-stream-container
            className="h-full overflow-y-auto pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <NoteStream
              searchQuery={searchQuery}
              filterDate={filterDate}
              filterTemplates={filterTemplates}
              onEditNote={handleEditNote}
              onTagClick={handleTagClick}
              onVisibleDateChange={setVisibleDate}
            />
          </article>
          {/* Gradient mask */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none bg-gradient-to-t from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent"
            aria-hidden="true"
          />
        </div>
        <Composer
          initialContent={editContent}
          editingNoteId={editingNoteId}
          onComplete={handleEditComplete}
        />
      </div>

      {/* Calendar Bar */}
      <div className="hidden md:block border-l border-zinc-200 dark:border-zinc-800">
        <CalendarBar visibleDate={visibleDate} />
      </div>
    </main>
  );
}

export default function AppRoot() {
  return (
    <Suspense
      fallback={
        <main className="grid place-items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <AppContent />
    </Suspense>
  );
}
