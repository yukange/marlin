"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Hash, Trash2, Library, FileText, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";

import { Heatmap } from "@/components/layout/heatmap";
import { useSidebar } from "@/components/layout/sidebar-context";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { db } from "@/lib/client/db";
import { cn, getPlatformKey } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentQuery = searchParams.get("q") || "";

  const isTrashActive = pathname?.endsWith("/trash");
  const isTemplatesActive = searchParams.get("filter") === "templates";
  // Check if we are on the main notes page (root or /notes if we change route)
  // Assuming /app is the main entry, or /notes.
  // We'll standardize on /app for now based on user request.
  const isAllNotesActive =
    pathname === "/app" &&
    !currentQuery &&
    !isTrashActive &&
    !isTemplatesActive;

  const [query, setQuery] = useState("");
  const [shortcutKey, setShortcutKey] = useState("");

  useEffect(() => {
    setShortcutKey(getPlatformKey());
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    setQuery(q || "");
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("sidebar-search-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.push(`/app?${params.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/app?${params.toString()}`, { scroll: false });
  };

  const allTags = useLiveQuery(async () => {
    const notes = await db.notes.filter((note) => !note.deleted).toArray();

    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }, []);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const targetQuery = `#${tag}`;

    if (currentQuery === targetQuery) {
      params.delete("q");
    } else {
      params.set("q", targetQuery);
    }

    router.push(`/app?${params.toString()}`);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen dark:bg-zinc-950 backdrop-blur-xl w-[300px] px-[10px] pt-[calc(10px+env(safe-area-inset-top))] pb-[calc(10px+env(safe-area-inset-bottom))] overflow-hidden",
        className
      )}
    >
      <nav className="flex-1 flex flex-col min-h-0 space-y-4">
        <section className="flex-shrink-0">
          <div className="mb-4 flex items-center gap-3 pl-2 pt-2">
            <Image
              src="/logo-light.svg"
              alt="Marlin Logo"
              width={32}
              height={32}
              className="hidden dark:block flex-shrink-0"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Marlin Logo"
              width={32}
              height={32}
              className="block dark:hidden flex-shrink-0"
              priority
            />
            <div className="flex items-center gap-2">
              <Image
                src="/text-logo-light.svg"
                alt="Marlin"
                width={80}
                height={24}
                className="hidden dark:block"
                priority
              />
              <Image
                src="/text-logo-dark.svg"
                alt="Marlin"
                width={80}
                height={24}
                className="block dark:hidden"
                priority
              />
            </div>
          </div>

          <div className="relative px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              id="sidebar-search-input"
              type="text"
              placeholder={`Search (${shortcutKey}K)`}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-9 h-9 w-full dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-600 text-sm"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </section>

        <section className="flex-shrink-0">
          <Heatmap />
        </section>

        <div className="flex-shrink-0">
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors",
              isAllNotesActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            )}
            onClick={() => router.push("/app")}
          >
            <Library className="mr-2 h-4 w-4" />
            All Notes
          </button>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors",
              isTemplatesActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            )}
            onClick={() => {
              if (isTemplatesActive) {
                router.push("/app");
              } else {
                router.push("/app?filter=templates");
              }
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </button>
        </div>

        {allTags && allTags.length > 0 && (
          <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <h2 className="mb-2 text-lg font-semibold tracking-tight dark:text-zinc-100 flex-shrink-0 px-3">
              Tags
            </h2>
            <ul className="flex-1 overflow-y-auto space-y-1 min-h-0 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {allTags.map((tag) => {
                const isSelected = currentQuery === `#${tag}`;
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-start px-3 py-2 text-sm rounded-md transition-colors",
                        isSelected
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      )}
                      onClick={() => handleTagClick(tag)}
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      {tag}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <div className="flex-shrink-0 mt-auto pt-2">
          <Button
            variant={isTrashActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200",
              isTrashActive &&
                "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            )}
            onClick={() => router.push("/app/trash")}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </Button>
        </div>
      </nav>
      <footer className="flex-shrink-0 mt-2">
        <UserNav />
      </footer>
    </aside>
  );
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <MobileSidebarContent />
      </SheetContent>
    </Sheet>
  );
}

function MobileSidebarContent() {
  return <Sidebar className="border-none" />;
}
