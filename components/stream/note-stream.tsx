"use client"

import { useState, useEffect, useRef } from 'react'
import { type Note } from '@/lib/client/db'
import { useNotes } from '@/hooks/use-notes'
import { useNoteMutations } from '@/hooks/use-composer'
import { useConfirmDialogStore } from '@/hooks/use-confirm-dialog'
import { formatRelativeTime, formatPreciseTime } from '@/lib/utils/date'
import { MoreHorizontal, Trash2, ExternalLink, ChevronDown, ChevronUp, Edit, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGitHubUser } from '@/hooks/use-github-user'
import { cn } from '@/lib/utils'
import { spaceToRepo } from '@/lib/services'
import { NoteContent } from './note-content'

const MAX_LINES = 12



interface NoteCardProps {
  note: Note
  onDelete: (note: Note) => void
  onEdit: (note: Note) => void
  onRetrySync: (note: Note) => void
  onTagClick: (tag: string) => void
  space: string
  highlight?: string
}

function NoteCard({ note, onDelete, onEdit, onRetrySync, onTagClick, space, highlight }: NoteCardProps) {
  const { data: user } = useGitHubUser()
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fullHeight, setFullHeight] = useState<number>(0)
  const content = note.content

  const contentLines = content.split('\n').length
  const shouldShowExpandButton = contentLines > MAX_LINES

  useEffect(() => {
    if (contentRef.current) {
      setFullHeight(contentRef.current.scrollHeight)
    }
  }, [content, isExpanded]) // Update height when content or expanded state changes

  const handleOpenInGitHub = () => {
    if (!user) return
    const repoName = spaceToRepo(space)
    const url = `https://github.com/${user.login}/${repoName}/blob/main/notes/${note.id}.md`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const syncStatus = note.syncStatus || 'synced'
  const syncConfig = {
    synced: {
      color: 'bg-green-500 dark:bg-green-600',
      tooltip: 'Synced with GitHub',
      animate: false
    },
    pending: {
      color: 'bg-amber-400 dark:bg-amber-500',
      tooltip: 'New note, not synced yet',
      animate: false
    },
    modified: {
      color: 'bg-amber-400 dark:bg-amber-500',
      tooltip: 'Modified locally, not synced yet',
      animate: false
    },
    syncing: {
      color: 'bg-blue-500 dark:bg-blue-600',
      tooltip: 'Syncing to GitHub...', 
      animate: true
    },
    error: {
      color: 'bg-red-500 dark:bg-red-600',
      tooltip: note.errorMessage || 'Failed to sync',
      animate: false
    }
  }[syncStatus]

  return (
    <article className="dark:bg-zinc-900 rounded-xl p-3 shadow-sm hover:shadow-md dark:shadow-zinc-800/50 dark:hover:shadow-zinc-800 transition-shadow relative border dark:border-zinc-800">
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <time>
                  {formatRelativeTime(note.date)}
                </time>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 shadow-md"
              >
                <p>{formatPreciseTime(note.date)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {note.tags.length > 0 && note.tags.map(tag => {
            const query = highlight?.trim() || ''
            const isHighlighted = query.startsWith('#') ? query === `#${tag}` : tag.toLowerCase().includes(query.toLowerCase())
            return (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick(tag)
                }}
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  isHighlighted
                    ? "bg-yellow-200 dark:bg-yellow-900 text-black dark:text-yellow-100 hover:bg-yellow-300 dark:hover:bg-yellow-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                #{tag}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          {/* Sync Status Indicator */}
          <div className="relative group">
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                syncConfig.color,
                syncConfig.animate && "animate-pulse"
              )}
              title={syncConfig.tooltip}
            />
            {/* Tooltip */}
            <div className="absolute right-0 top-6 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {syncConfig.tooltip}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {syncStatus === 'error' && (
                <>
                  <DropdownMenuItem onClick={() => onRetrySync(note)} className="text-amber-600 dark:text-amber-400">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Sync
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onEdit(note)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenInGitHub}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in GitHub
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(note)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="relative">
        <div
          ref={contentRef}
          className={cn(
            "max-w-none break-words overflow-hidden transition-[max-height] duration-300 ease-in-out",
          )}
          style={{
            maxHeight: !shouldShowExpandButton 
              ? undefined 
              : isExpanded 
                ? `${fullHeight}px` 
                : `${MAX_LINES * 1.5}rem`
          }}
        >
          <NoteContent content={content} highlight={highlight} space={space} />
        </div>

        {!isExpanded && shouldShowExpandButton && (
          <footer className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-zinc-900 via-white/60 dark:via-zinc-900/60 to-transparent flex items-end justify-center pb-2 pointer-events-none transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 text-xs bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm rounded-full px-3 text-zinc-600 dark:text-zinc-300 pointer-events-auto transition-all hover:scale-105 active:scale-95"
            >
              <ChevronDown className="mr-1 h-3 w-3" />
              Show more
            </Button>
          </footer>
        )}

        {isExpanded && shouldShowExpandButton && (
          <footer className="flex justify-center mt-4 animate-in fade-in duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-7 text-xs bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm rounded-full px-3 text-zinc-600 dark:text-zinc-300 transition-all hover:scale-105 active:scale-95"
            >
              <ChevronUp className="mr-1 h-3 w-3" />
              Collapse
            </Button>
          </footer>
        )}
      </section>
    </article>
  )
}

interface NoteStreamProps {
  space: string
  searchQuery?: string
  filterDate?: string
  onEditNote?: (content: string, noteId: string) => void
  onTagClick?: (tag: string) => void
}

export function NoteStream({ space, searchQuery = '', filterDate = '', onEditNote, onTagClick }: NoteStreamProps) {
  const notes = useNotes(space, searchQuery, filterDate)
  const { deleteNote, retrySync } = useNoteMutations()
  const openDialog = useConfirmDialogStore((state) => state.openDialog)

  const handleEdit = (note: Note) => {
      onEditNote?.(note.content, note.id)
  }

  const handleRetrySync = async (note: Note) => {
    await retrySync(note.id, space)
  }

  const handleDelete = async (note: Note) => {
    openDialog({
      title: 'Delete Note?',
      description: 'This note will be permanently deleted. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        await deleteNote(note.id, space)
      },
    })
  }

  if (!notes) return null

  return (
    <section className="flex flex-col-reverse min-h-0 gap-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onRetrySync={handleRetrySync}
          onTagClick={onTagClick || (() => {})}
          space={space}
          highlight={searchQuery}
        />
      ))}
    </section>
  )
}