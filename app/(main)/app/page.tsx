"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useSpaces } from "@/hooks/use-spaces";
import { useStore } from "@/lib/store";

import type { Space } from "@/lib/client/db";

export default function AppRoot() {
  const router = useRouter();
  const { lastActiveSpace, isUnauthorized } = useStore();
  const { spaces, isLoading } = useSpaces();

  useEffect(() => {
    // Don't redirect if unauthorized - we'll show reconnect UI
    if (isUnauthorized) {
      return;
    }

    if (!isLoading && spaces) {
      if (spaces.length > 0) {
        // Priority 1: Last active space (if it still exists)
        if (
          lastActiveSpace &&
          spaces.some((s: Space) => s.name === lastActiveSpace)
        ) {
          router.push(`/${lastActiveSpace}`);
        } else {
          // Priority 2: Most recently updated space
          router.push(`/${spaces[0].name}`);
        }
      } else {
        // No spaces: redirect to create new space
        router.push("/new");
      }
    }
  }, [spaces, isLoading, lastActiveSpace, router, isUnauthorized]);

  // Show reconnect UI if unauthorized
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

  return (
    <main className="grid place-items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </main>
  );
}
