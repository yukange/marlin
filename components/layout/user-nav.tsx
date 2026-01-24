"use client";

import {
  Monitor,
  Sun,
  Moon,
  LogOut,
  Shield,
  RefreshCw,
  AlertCircle,
  Loader2,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGitHubUser } from "@/hooks/use-github-user";
import { useLicense } from "@/hooks/use-license";
import { db, hasUnsyncedChanges } from "@/lib/client/db";
import { syncWorkspace } from "@/lib/services/sync-service";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { data: session } = useSession();
  const sessionUser = session?.user;
  const { data: githubUser } = useGitHubUser();
  const { theme, setTheme } = useTheme();
  const { syncStatus, setSyncStatus, networkStatus, isUnauthorized } =
    useStore();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isPro } = useLicense();

  const isSyncing = syncStatus === "syncing";

  // Determine status dot color
  const statusColor = isUnauthorized
    ? "bg-red-500"
    : {
        offline: "bg-zinc-400",
        online: "bg-emerald-500",
      }[networkStatus];

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    try {
      const hasUnsynced = await hasUnsyncedChanges();
      if (hasUnsynced) {
        setShowLogoutAlert(true);
      } else {
        await performLogout();
      }
    } catch (error) {
      console.error("Failed to check sync status:", error);
      // Fallback to safe logout if check fails
      await performLogout();
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await db.delete();
    } catch (error) {
      console.error("Failed to clear database:", error);
    }
    await signOut();
  };

  const handleSyncCurrentSpace = async () => {
    if (!githubUser?.login || isSyncing) {
      return;
    }

    setSyncStatus("syncing");
    try {
      const { uploaded, downloaded, pruned, conflicts } = await syncWorkspace(
        githubUser.login
      );

      if (
        uploaded === 0 &&
        downloaded === 0 &&
        pruned === 0 &&
        conflicts === 0
      ) {
        toast.success("Already up to date");
      } else {
        const messages: string[] = [];
        if (uploaded > 0) {
          messages.push(`${uploaded} uploaded`);
        }
        if (downloaded > 0) {
          messages.push(`${downloaded} downloaded`);
        }
        if (pruned > 0) {
          messages.push(`${pruned} deleted`);
        }
        if (conflicts > 0) {
          messages.push(`${conflicts} conflicts`);
          toast.warning(
            `Synced with conflicts: ${messages.join(", ")}. Check notes tagged with #conflict`
          );
        } else {
          toast.success(`Synced: ${messages.join(", ")}`);
        }
      }
      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to sync:", error);
      toast.error("Sync failed. Please try again.");
      setSyncStatus("error");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto w-full justify-start p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="relative">
              <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage
                  src={sessionUser?.image || ""}
                  alt={sessionUser?.name || ""}
                />
                <AvatarFallback className="rounded-md">
                  {sessionUser?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-950",
                  statusColor
                )}
              />
            </div>
            <div className="ml-3 flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium leading-none">
                  {sessionUser?.name}
                </span>
                {isPro && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    <Crown className="h-2.5 w-2.5" />
                    PRO
                  </span>
                )}
              </div>
              <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {sessionUser?.email}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[280px]" align="start" forceMount>
          <Tabs
            value={theme}
            onValueChange={setTheme}
            className="w-full px-1 py-1"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="system"
                className="border-0 transition-all duration-200 hover:bg-zinc-50 hover:dark:bg-zinc-700 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-md"
              >
                <Monitor className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger
                value="light"
                className="border-0 transition-all duration-200 hover:bg-zinc-50 hover:dark:bg-zinc-700 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-md"
              >
                <Sun className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger
                value="dark"
                className="border-0 transition-all duration-200 hover:bg-zinc-50 hover:dark:bg-zinc-700 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-md"
              >
                <Moon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <DropdownMenuSeparator className="my-1" />
          {isUnauthorized && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  signIn("github");
                }}
                className="cursor-pointer mx-1 my-1 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Reconnect
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
            </>
          )}
          {!isUnauthorized && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  handleSyncCurrentSpace();
                }}
                disabled={isSyncing}
                className="cursor-pointer mx-1 my-1"
              >
                <RefreshCw
                  className={cn(
                    "mr-2 h-4 w-4 text-zinc-500",
                    isSyncing && "animate-spin"
                  )}
                />
                {isSyncing ? "Syncing..." : "Sync Notes"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
            </>
          )}
          {isPro ? (
            <>
              <DropdownMenuItem asChild className="cursor-pointer mx-1 my-1">
                <a
                  href="https://creem.io/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                  Manage Subscription
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
            </>
          ) : (
            <>
              <DropdownMenuItem asChild className="cursor-pointer mx-1 my-1">
                <Link href="/pricing" className="flex items-center">
                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                  Upgrade to Pro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
            </>
          )}
          <DropdownMenuItem asChild className="cursor-pointer mx-1 my-1">
            <Link href="/privacy" className="flex items-center">
              <Shield className="mr-2 h-4 w-4 text-zinc-500" />
              Privacy Policy
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer mx-1 my-1">
            <Link href="/terms" className="flex items-center">
              <Shield className="mr-2 h-4 w-4 text-zinc-500" />
              Terms of Service
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            disabled={isLoggingOut}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 mx-1 my-1"
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4 text-red-600" />
            )}
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsynced Changes Detected</DialogTitle>
            <DialogDescription>
              You have notes that haven&apos;t been synced to GitHub yet.
              Logging out will delete all local data, and these changes will be
              lost forever.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutAlert(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isLoggingOut}
              onClick={() => {
                performLogout();
              }}
            >
              {isLoggingOut && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete & Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
