"use client"

import { useEffect, useRef } from 'react'
import { type Note } from '@/lib/client/db'
import { useNotes } from '@/hooks/use-notes'
import { useNoteMutations } from '@/hooks/use-composer'
import { useConfirmDialogStore } from '@/hooks/use-confirm-dialog'
import { Trash2 } from 'lucide-react'
import { NoteCard } from './note-card'

interface NoteStreamProps {
  space: string
  searchQuery?: string
  filterDate?: string
  filterTemplates?: boolean
  onEditNote?: (content: string, noteId: string) => void
  onTagClick?: (tag: string) => void
  onVisibleDateChange?: (date: string | null) => void
  scrollToDate?: string | null // Date to scroll to (from CalendarBar)
  isInTrash?: boolean
}

export function NoteStream({ space, searchQuery = '', filterDate = '', filterTemplates = false, onEditNote, onTagClick, onVisibleDateChange, scrollToDate, isInTrash = false }: NoteStreamProps) {
  const notes = useNotes(space, searchQuery, filterDate, isInTrash, filterTemplates)
  const { deleteNote, restoreNote, permanentDeleteNote, retrySync, toggleTemplate } = useNoteMutations()
  const openDialog = useConfirmDialogStore((state) => state.openDialog)
  const containerRef = useRef<HTMLElement>(null)

  // Flag to prevent triggering onVisibleDateChange during programmatic scroll
  const isProgrammaticScroll = useRef(false)
  const lastScrollToDate = useRef<string | null>(null)

  // Scroll to date when triggered from CalendarBar
  useEffect(() => {
    if (!scrollToDate || !containerRef.current || scrollToDate === lastScrollToDate.current) return

    // Find the first note with matching date
    const noteElement = containerRef.current.querySelector(`[data-date="${scrollToDate}"]`)
    if (noteElement) {
      isProgrammaticScroll.current = true
      lastScrollToDate.current = scrollToDate

      // Get the parent scrollable container (the article element)
      const scrollContainer = containerRef.current.parentElement
      if (scrollContainer) {
        noteElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }

      // Reset flag after scroll completes
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 600)
    }
  }, [scrollToDate])

  // IntersectionObserver to detect visible notes and sync with CalendarBar
  useEffect(() => {
    if (!containerRef.current || !onVisibleDateChange) return

    // The actual scroll container is the parent article element
    const scrollContainer = containerRef.current.parentElement
    if (!scrollContainer) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Skip if this is a programmatic scroll
        if (isProgrammaticScroll.current) return

        // Find the most visible note (highest intersection ratio)
        const visibleEntries = entries.filter(e => e.isIntersecting)
        if (visibleEntries.length === 0) return

        // Get all currently visible notes in the viewport
        const container = containerRef.current
        if (!container) return

        const noteElements = container.querySelectorAll('[data-date]')
        const visibleNotes: { element: Element; rect: DOMRect; date: string }[] = []

        const scrollRect = scrollContainer.getBoundingClientRect()

        noteElements.forEach(el => {
          const rect = el.getBoundingClientRect()

          // Check if element is in scroll container's viewport
          if (rect.top < scrollRect.bottom && rect.bottom > scrollRect.top) {
            const date = el.getAttribute('data-date')
            if (date) {
              visibleNotes.push({ element: el, rect, date })
            }
          }
        })

        if (visibleNotes.length > 0) {
          // Since flex-col-reverse, the first visible note from top is the newest visible
          // Sort by top position and get the one closest to top
          visibleNotes.sort((a, b) => a.rect.top - b.rect.top)
          const topVisibleNote = visibleNotes[0]
          onVisibleDateChange(topVisibleNote.date)
        }
      },
      {
        root: scrollContainer, // Use the actual scroll container as root
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '0px'
      }
    )

    // Observe all note cards
    const noteElements = containerRef.current.querySelectorAll('[data-date]')
    noteElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [notes, onVisibleDateChange])

  const handleEdit = (note: Note) => {
    onEditNote?.(note.content, note.id)
  }

  const handleRetrySync = async (note: Note) => {
    await retrySync(note.id, space)
  }

  const handleDelete = async (note: Note) => {
    await deleteNote(note.id, space)
  }

  const handleRestore = async (note: Note) => {
    await restoreNote(note.id, space)
  }

  const handleToggleTemplate = async (note: Note) => {
    await toggleTemplate(note.id, space, !note.isTemplate)
  }

  const handlePermanentDelete = async (note: Note) => {
    openDialog({
      title: 'Delete Forever?',
      description: 'This note will be permanently deleted from GitHub and cannot be recovered.',
      confirmText: 'Delete Forever',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        await permanentDeleteNote(note.id, space)
      },
    })
  }

  if (!notes) return null
  if (notes.length === 0) {
    if (isInTrash) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
          <Trash2 className="h-8 w-8 mb-2 opacity-50" />
          <p>Trash is empty</p>
        </div>
      )
    }
    // Only show empty state if not filtering (to avoid showing "No notes" when search yields nothing if we want different UI for search)
    // But for now, simple empty is fine.
    if (!searchQuery && !filterDate) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
          <p>No notes yet</p>
        </div>
      )
    }
  }

  return (
    <section ref={containerRef} className="flex flex-col-reverse min-h-0 gap-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onRetrySync={handleRetrySync}
          onTagClick={onTagClick || (() => { })}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onToggleTemplate={handleToggleTemplate}
          space={space}
          highlight={searchQuery}
          isInTrash={isInTrash}
        />
      ))}
    </section>
  )
}
