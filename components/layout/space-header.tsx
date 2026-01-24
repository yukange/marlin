"use client";

import { Menu } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";

interface SpaceHeaderProps {
  spaceName?: string;
}

export function SpaceHeader({}: SpaceHeaderProps) {
  const { setSidebarOpen, isMobile } = useSidebar();

  // On desktop, this header is completely hidden as search is now in sidebar
  if (!isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl dark:bg-zinc-950/70 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 md:hidden">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="-ml-2 flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
