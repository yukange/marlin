"use client";

/**
 * Skeleton components for loading states
 * These match the final UI structure for smooth transitions
 */

export function SidebarSkeleton() {
  return (
    <aside className="pb-12 min-h-screen dark:bg-zinc-950 backdrop-blur-xl w-[300px] p-[10px]">
      <div className="h-full w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 p-4 flex flex-col">
        {/* Logo area */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Space switcher */}
        <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-6" />

        {/* Heatmap placeholder */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>

        {/* Navigation items */}
        <div className="space-y-2 mb-6">
          <div className="h-9 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Tags section */}
        <div className="mb-3">
          <div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
        </div>
        <div className="space-y-1.5 flex-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>

        {/* User footer */}
        <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-1" />
              <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function NoteStreamSkeleton() {
  return (
    <div className="space-y-4 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
        >
          {/* Date and tags */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>

          {/* Title */}
          <div className="h-7 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />

          {/* Content lines */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComposerSkeleton() {
  return (
    <div className="h-16 bg-white dark:bg-zinc-900 ml-3 mr-4 rounded-t-2xl shadow-[0_-2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_8px_rgba(0,0,0,0.3)]">
      <div className="h-full flex items-center px-6">
        <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

export function SpaceHeaderSkeleton() {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-9 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    </header>
  );
}
