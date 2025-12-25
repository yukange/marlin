"use client"

import dynamic from "next/dynamic"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { useAutoSync } from "@/hooks/use-auto-sync"
import { SidebarSkeleton } from "@/components/ui/skeletons"

const Sidebar = dynamic(() => import("@/components/layout/sidebar").then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
  loading: () => <SidebarSkeleton />
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
      <MobileSidebar />

      <div className="hidden md:grid md:place-items-center min-h-screen">
        <div className="grid grid-cols-[300px_1fr] w-full max-w-[1180px]">
          <aside className="sticky top-0 h-screen">
            <Sidebar showNewSpace={showNewSpace} onNewSpaceChange={setShowNewSpace} />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <main className="md:hidden min-h-screen flex flex-col">{children}</main>
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
