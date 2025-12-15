"use client"

import { useSync } from '@/hooks/use-sync'
import { NoteStream } from '@/components/stream/note-stream'
import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSpaces } from '@/hooks/use-spaces'
import { Trash2, Menu } from 'lucide-react'
import { useSidebar } from '@/components/layout/sidebar-context'
import { Button } from '@/components/ui/button'

export default function TrashPage({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceName } = use(params)
  const router = useRouter()
  const { setSidebarOpen, isMobile } = useSidebar()
  
  const { spaces, isLoading: isLoadingSpaces } = useSpaces()
  
  useSync(spaceName)

  // Validate space existence
  useEffect(() => {
    if (!isLoadingSpaces && spaces) {
      const spaceExists = spaces.some(s => s.name === spaceName)
      if (!spaceExists) {
        router.push('/app')
      }
    }
  }, [spaceName, spaces, isLoadingSpaces, router])

  return (
    <main className="h-[calc(100vh-3.5rem)] md:h-screen dark:bg-zinc-950 flex flex-col overflow-hidden">
      {/* Trash Specific Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl dark:bg-zinc-950/70 px-6 py-4 border-b border-transparent dark:border-zinc-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="-ml-2 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Trash2 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Trash</h1>
          </div>
        </div>
      </header>
      
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <article 
          data-note-stream-container
          className="h-full overflow-y-auto [scrollbar-gutter:stable] p-3 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <NoteStream 
            space={spaceName} 
            isInTrash={true}
          />
        </article>
      </div>
    </main>
  )
}