import { useState, useEffect, useRef } from 'react'
import { useEditor, Editor } from '@tiptap/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useGitHubUser } from './use-github-user'
import { getMarlinExtensions } from '@/components/editor/extensions'
import { PROSE_CLASSES } from '@/components/editor/styles'

// ============================================================================
// Types
// ============================================================================

interface UseComposerStateOptions {
  initialContent?: string
  editingNoteId?: string
  onSetContent?: (content: string) => void
  onFocus?: (position: 'end') => void
}

interface UseMarlinEditorOptions {
  isExpanded: boolean
  space?: string
  onUpdate?: (isEmpty: boolean) => void
}

interface UseComposerShortcutsOptions {
  isEmpty: boolean
  isSending: boolean
  isExpanded: boolean
  onSend: () => void
  onNewNote: () => void
  onClose: () => void
}

interface UseComposerSubmitOptions {
  space: string
  getMarkdownContent: () => string
  currentNoteId?: string
  onSuccess: () => void
}

interface CreateNoteParams {
  space: string
  content: string
  tags: string[]
}

interface UpdateNoteParams {
  id: string
  space: string
  content: string
  tags: string[]
}

// ============================================================================
// Helpers
// ============================================================================

export const parseTagsToMentions = (editor: Editor) => {
  const regex = /(?:^|\s)(#([a-zA-Z0-9_]+))/g
  const { tr } = editor.state
  const replacements: { start: number, end: number, id: string }[] = []

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    
    const text = node.text
    let match
    while ((match = regex.exec(text)) !== null) {
      const matchStart = match.index
      const matchText = match[0]
      
      let start = pos + matchStart
      // Adjust if there was a leading space matched
      if (matchText.startsWith(' ')) {
        start += 1
      }
      
      const id = match[2]
      const end = start + id.length + 1 // +1 for #
      
      replacements.push({ start, end, id })
    }
  })

  // Apply reverse to maintain positions
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, id } = replacements[i]
    tr.replaceWith(start, end, editor.schema.nodes.mention.create({ id }))
  }
  
  if (replacements.length > 0) {
    editor.view.dispatch(tr)
  }
}

// ============================================================================
// Composer State Hook
// ============================================================================

export function useComposerState({
  initialContent,
  editingNoteId,
  onSetContent,
  onFocus,
}: UseComposerStateOptions = {}) {
  const [isSending, setIsSending] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>(undefined)
  const editorRef = useRef<HTMLDivElement>(null)

  // Handle initial content for editing
  useEffect(() => {
    if (!initialContent || !editingNoteId) return

    const timer = setTimeout(() => {
      setIsExpanded(true)
      setCurrentNoteId(editingNoteId)
      
      // Defer content setting to avoid conflict between React render (setIsExpanded)
      // and Tiptap's ReactNodeViewRenderer (which might use flushSync)
      requestAnimationFrame(() => {
        onSetContent?.(initialContent)
        requestAnimationFrame(() => {
          onFocus?.('end')
        })
      })
    }, 150)

    return () => clearTimeout(timer)
  }, [editingNoteId])

  // Handle click outside to collapse (only for new notes)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = 'touches' in event ? event.touches[0]?.target : event.target
      if (editorRef.current && target && !editorRef.current.contains(target as Node)) {
        if (isEmpty && isExpanded && !currentNoteId) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isEmpty, isExpanded, currentNoteId])

  const expand = () => {
    setIsExpanded(true)
  }

  const collapse = () => {
    setIsExpanded(false)
  }

  const reset = () => {
    setIsExpanded(false)
    setCurrentNoteId(undefined)
  }

  const startEditing = (noteId: string) => {
    setIsExpanded(true)
    setCurrentNoteId(noteId)
  }

  const startNewNote = () => {
    setIsExpanded(true)
    setCurrentNoteId(undefined)
  }

  return {
    isSending,
    setIsSending,
    isEmpty,
    setIsEmpty,
    isExpanded,
    setIsExpanded,
    currentNoteId,
    setCurrentNoteId,
    editorRef,
    expand,
    collapse,
    reset,
    startEditing,
    startNewNote,
  }
}

// ============================================================================
// Marlin Editor Hook
// ============================================================================

export function useMarlinEditor({ isExpanded, onUpdate, space }: UseMarlinEditorOptions) {
  const [, forceUpdate] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getMarlinExtensions({ 
      isExpanded, 
      placeholder: isExpanded ? 'Write something...' : 'Type a note...',
      space
    }),
    editorProps: {
      attributes: {
        class: cn(
          PROSE_CLASSES,
          'px-4',
          isExpanded ? 'min-h-[200px] py-4' : 'min-h-[20px] py-2'
        ),
        // iOS Safari compatibility: ensure contenteditable and input attributes
        contenteditable: 'true',
        inputmode: 'text',
        autocomplete: 'off',
        autocorrect: 'on',
        autocapitalize: 'sentences',
        spellcheck: 'false',
      },
    },
    onTransaction: () => {
      queueMicrotask(() => {
        forceUpdate((prev) => prev + 1)
      })
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.isEmpty)
    },
  })

  const getMarkdownContent = () => {
    return editor?.storage.markdown?.getMarkdown() || ''
  }

  const setContent = (content: string) => {
    editor?.commands.setContent(content)
    if (editor) {
      parseTagsToMentions(editor)
    }
  }

  const clearContent = () => {
    editor?.commands.clearContent()
  }

  const focus = (position?: 'start' | 'end') => {
    if (position) {
      editor?.commands.focus(position)
    } else {
      editor?.commands.focus()
    }
  }

  return {
    editor,
    getMarkdownContent,
    setContent,
    clearContent,
    focus,
  }
}

// ============================================================================
// Composer Shortcuts Hook
// ============================================================================

export function useComposerShortcuts({
  isEmpty,
  isSending,
  isExpanded,
  onSend,
  onNewNote,
  onClose,
}: UseComposerShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC: Close composer
      if (event.key === 'Escape' && isExpanded) {
        event.preventDefault()
        if (!isSending) {
          onClose()
        }
      }

      // Cmd+N or Ctrl+N: Create new note (clear editor)
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault()
        if (!isSending) {
          onNewNote()
        }
      }

      // Cmd+Enter or Ctrl+Enter: Send note
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!isEmpty && !isSending) {
          onSend()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEmpty, isSending, isExpanded, onSend, onNewNote, onClose])
}

// ============================================================================
// Note Mutations Hook
// ============================================================================

export function useNoteMutations() {
  const { data: user } = useGitHubUser()

  const createNote = async (params: CreateNoteParams) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { createNote: createNoteService } = await import('@/lib/services/note-service')
      await createNoteService({ ...params, userLogin: user.login })
      toast.success('Saved locally')
    } catch (error) {
      console.error('Failed to save note locally:', error)
      toast.error('Failed to save note. Please check browser storage.')
      throw error
    }
  }

  const updateNote = async (params: UpdateNoteParams) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { updateNote: updateNoteService } = await import('@/lib/services/note-service')
      await updateNoteService({ ...params, userLogin: user.login })
      toast.success('Saved locally')
    } catch (error) {
      console.error('Failed to save note locally:', error)
      toast.error('Failed to save note. Please check browser storage.')
      throw error
    }
  }

  const deleteNote = async (id: string, space: string) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { deleteNote: deleteNoteService } = await import('@/lib/services/note-service')
      await deleteNoteService(id, space, user.login)
      toast.success('Note deleted')
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast.error('Failed to delete note from GitHub')
      throw error
    }
  }

  const retrySync = async (noteId: string, space: string) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { retrySingleNote } = await import('@/lib/services/sync-service')
      await retrySingleNote(noteId, space, user.login)
      toast.success('Note synced successfully')
    } catch (error) {
      console.error('Failed to retry sync:', error)
      toast.error('Failed to sync note')
      throw error
    }
  }

  return {
    createNote,
    updateNote,
    deleteNote,
    retrySync,
  }
}

// ============================================================================
// Composer Submit Hook
// ============================================================================

export function useComposerSubmit({
  space,
  getMarkdownContent,
  currentNoteId,
  onSuccess,
}: UseComposerSubmitOptions) {
  const { createNote, updateNote } = useNoteMutations()

  const extractTags = (content: string): string[] => {
    return (content.match(/#[a-zA-Z0-9_]+/g) || []).map((tag: string) => tag.slice(1))
  }

  const handleSubmit = async () => {
    const markdownContent = getMarkdownContent()
    const tags = extractTags(markdownContent)

    if (currentNoteId) {
      // Edit existing note
      await updateNote({
        id: currentNoteId,
        space,
        content: markdownContent,
        tags,
      })
    } else {
      // Create new note
      await createNote({
        space,
        content: markdownContent,
        tags,
      })
    }

    onSuccess()
  }

  return {
    handleSubmit,
  }
}
