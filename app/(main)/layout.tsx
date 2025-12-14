"use client"

import dynamic from "next/dynamic"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { useAutoSync } from "@/hooks/use-auto-sync"

const Sidebar = dynamic(() => import("@/components/layout/sidebar").then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
  loading: () => (
    <aside className="pb-12 min-h-screen  dark:bg-zinc-950 backdrop-blur-xl w-[300px] p-[10px]">
      <div className="h-full w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </aside>
  )
})

const MobileSidebar = dynamic(() => import("@/components/layout/sidebar").then(mod => ({ default: mod.MobileSidebar })), {
  ssr: false
})

const queryClient = new QueryClient()

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { showNewSpace, setShowNewSpace } = useSidebar()
  
  // Initialize network status monitoring
  useNetworkStatus()
  
  // Initialize background sync engine
  useAutoSync()

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 h-14">
        <MobileSidebar />
        <h1 className="font-semibold">Marlin</h1>
      </header>

      <div className="hidden md:grid md:place-items-center min-h-screen">
        <div className="grid grid-cols-[300px_1fr] w-full max-w-[1020px]">
          <aside className="sticky top-0 h-screen">
            <Sidebar showNewSpace={showNewSpace} onNewSpaceChange={setShowNewSpace} />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <main className="md:hidden pt-14">{children}</main>
    </>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <MainLayoutContent>{children}</MainLayoutContent>
          <Toaster position="top-center" />
        </SidebarProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
