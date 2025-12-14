"use client"

import { useSync } from '@/hooks/use-sync'
import { NoteStream } from '@/components/stream/note-stream'
import { Composer } from '@/components/editor/composer'
import { SpaceHeader } from '@/components/layout/space-header'
import { use, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSpaces } from '@/hooks/use-spaces'

export default function SpacePage({ params }: { params: Promise<{ space: string }> }) {
  const { space: spaceName } = use(params) // URL param is the display name
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const filterDate = searchParams.get('date') || ''
  const [editContent, setEditContent] = useState<string>()
  const [editingNoteId, setEditingNoteId] = useState<string>()
  
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
    <main className="h-[calc(100vh-3.5rem)] md:h-screen dark:bg-zinc-950 flex flex-col overflow-hidden">
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
            onEditNote={handleEditNote}
            onTagClick={handleTagClick}
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
    </main>
  )
}
