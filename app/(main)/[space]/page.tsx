"use client"

import { useSync } from '@/hooks/use-sync'
import { NoteStream } from '@/components/stream/note-stream'
import { SpaceHeader } from '@/components/layout/space-header'
import { use, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSpaces } from '@/hooks/use-spaces'
import { db } from '@/lib/client/db'
import dynamic from 'next/dynamic'
import { CalendarBar } from '@/components/layout/calendar-bar'

const Composer = dynamic(() => import('@/components/editor/composer').then(mod => mod.Composer), {
  ssr: false,
  loading: () => (
    <div className="h-24 w-full p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center">
      <div className="h-10 w-full max-w-3xl rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    </div>
  )
})

export default function SpacePage({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceName } = use(params) // URL param is the display name
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const filterDate = searchParams.get('date') || ''
  const filterTemplates = searchParams.get('filter') === 'templates'
  const [editContent, setEditContent] = useState<string>()
  const [editingNoteId, setEditingNoteId] = useState<string>()
  const [visibleDate, setVisibleDate] = useState<string | null>(null)

  const { spaces, isLoading: isLoadingSpaces } = useSpaces()

  useSync(spaceName)

  // Validate space existence - directly query Dexie to avoid stale data issues
  // useLiveQuery may have brief delay after db.spaces.put() completes
  useEffect(() => {
    // Don't redirect if still loading
    if (isLoadingSpaces) return

    // Directly check Dexie DB for immediate consistency
    db.spaces.get(spaceName).then(space => {
      if (!space) {
        // Space doesn't exist in DB, redirect to /app
        router.push('/app')
      }
    })
  }, [spaceName, isLoadingSpaces, router])

  const handleEditNote = (content: string, noteId: string) => {
    setEditContent(content)
    setEditingNoteId(noteId)
  }

  const handleEditComplete = () => {
    setEditContent(undefined)
    setEditingNoteId(undefined)
  }

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentQuery = params.get('q')
    const targetQuery = `#${tag}`

    if (currentQuery === targetQuery) {
      params.delete('q')
    } else {
      params.set('q', targetQuery)
    }

    router.push(`/${spaceName}?${params.toString()}`, { scroll: false })
  }

  return (
    <main className="h-[calc(100vh-3.5rem)] md:h-screen dark:bg-zinc-950 flex overflow-hidden">
      {/* Left column: Header + NoteStream + Composer */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <SpaceHeader spaceName={spaceName} />
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <article
            data-note-stream-container
            className="h-full overflow-y-auto [scrollbar-gutter:stable] p-3 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <NoteStream
              space={spaceName}
              searchQuery={searchQuery}
              filterDate={filterDate}
              filterTemplates={filterTemplates}
              onEditNote={handleEditNote}
              onTagClick={handleTagClick}
              onVisibleDateChange={setVisibleDate}
            />
          </article>
          {/* Gradient mask to fade out content before Composer */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none bg-gradient-to-t from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent"
            aria-hidden="true"
          />
        </div>
        <Composer
          space={spaceName}
          initialContent={editContent}
          editingNoteId={editingNoteId}
          onComplete={handleEditComplete}
        />
      </div>

      {/* Calendar Bar - right sidebar, hidden on mobile, spans full height */}
      <div className="hidden md:block border-l border-zinc-200 dark:border-zinc-800">
        <CalendarBar space={spaceName} visibleDate={visibleDate} />
      </div>
    </main>
  )
}
