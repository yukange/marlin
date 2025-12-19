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
  images?: string[] // Image filenames to track in frontmatter
}

interface UpdateNoteParams {
  id: string
  space: string
  content: string
  images?: string[] // Image filenames to track in frontmatter
}

// ============================================================================
// Helpers
// ============================================================================

export const parseTagsToMentions = (editor: Editor) => {
  const regex = /(?:^|\s)(#([\p{L}\p{N}_\-]+))/gu
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

/**
 * Insert template content at cursor position (standalone helper)
 * - Inserts content at current cursor
 * - Parses hashtags to styled mention nodes
 * - Scrolls to show inserted content
 */
export const insertTemplateContent = (editor: Editor, content: string) => {
  editor.chain().focus().insertContent(content).run()
  parseTagsToMentions(editor)
  editor.commands.scrollIntoView()
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

      // Check if click matches ignore selector (e.g., for popovers/dialogs rendered in portals)
      if (target instanceof Element && target.closest('[data-composer-ignore-outside]')) {
        return
      }

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

  /**
   * Insert template content at cursor position
   * - Inserts content at current cursor
   * - Parses hashtags to styled mention nodes
   * - Scrolls to show inserted content
   */
  const insertTemplate = (content: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(content).run()
    parseTagsToMentions(editor)
    editor.commands.scrollIntoView()
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
    insertTemplate,
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
      toast.success('Note moved to trash')
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast.error('Failed to delete note')
      throw error
    }
  }

  const restoreNote = async (id: string, space: string) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { restoreNote: restoreNoteService } = await import('@/lib/services/note-service')
      await restoreNoteService(id, space, user.login)
      toast.success('Note restored')
    } catch (error) {
      console.error('Failed to restore note:', error)
      toast.error('Failed to restore note')
      throw error
    }
  }

  const permanentDeleteNote = async (id: string, space: string) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { permanentDeleteNote: permanentDeleteNoteService } = await import('@/lib/services/note-service')
      await permanentDeleteNoteService(id, space, user.login)
      toast.success('Note permanently deleted')
    } catch (error) {
      console.error('Failed to delete note permanently:', error)
      toast.error('Failed to delete note')
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

  const toggleTemplate = async (noteId: string, space: string, isTemplate: boolean) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }
    try {
      const { toggleNoteTemplate } = await import('@/lib/services/note-service')
      await toggleNoteTemplate(noteId, space, user.login, isTemplate)
      toast.success(isTemplate ? 'Marked as template' : 'Unmarked template')
    } catch (error) {
      console.error('Failed to toggle template:', error)
      toast.error('Failed to update template status')
      throw error
    }
  }

  return {
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    retrySync,
    toggleTemplate,
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
  const { uploadPendingImages, hasPendingImages } = useImageUpload({ space })

  const handleSubmit = async () => {
    let markdownContent = getMarkdownContent()

    // Upload any pending base64 images before saving
    if (hasPendingImages(markdownContent)) {
      const toastId = toast.loading('Uploading images...')
      try {
        markdownContent = await uploadPendingImages(markdownContent)
        toast.success('Images uploaded!', { id: toastId })
      } catch (error) {
        console.error('Failed to upload images:', error)
        toast.error('Failed to upload images', { id: toastId })
        throw error // Don't save if images failed to upload
      }
    }

    // Extract current images from content for tracking (used by GitHub Actions cleanup)
    const { extractImageFilenames } = await import('@/lib/utils/markdown')
    const currentImages = extractImageFilenames(markdownContent)

    if (currentNoteId) {
      // Edit existing note
      await updateNote({
        id: currentNoteId,
        space,
        content: markdownContent,
        images: currentImages,
      })
    } else {
      // Create new note
      await createNote({
        space,
        content: markdownContent,
        images: currentImages,
      })
    }

    onSuccess()
  }

  return {
    handleSubmit,
  }
}

// ============================================================================
// Image Upload Hook (Local-First)
// ============================================================================

interface UseImageUploadOptions {
  space: string
}

/**
 * Local-first image upload hook
 * 
 * Flow:
 * 1. insertLocalImage: Convert file to base64 data URL, insert into editor immediately (no network)
 * 2. uploadPendingImages: Called on submit, finds all data URLs, uploads to GitHub, returns final markdown
 */
export function useImageUpload({ space }: UseImageUploadOptions) {
  const { data: user } = useGitHubUser()

  /**
   * Insert image as base64 data URL immediately (local-first, no network)
   */
  const insertLocalImage = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return null
    }

    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error('Image too large. Maximum size is 5MB.')
      return null
    }

    // Convert to data URL for immediate display
    const dataUrl = await fileToDataUrl(file)
    return dataUrl
  }

  /**
   * Upload all pending base64 images in markdown content
   * Returns the markdown with base64 URLs replaced with real URLs
   */
  const uploadPendingImages = async (markdown: string): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Find all base64 image data URLs in markdown
    // Pattern: ![...](data:image/...;base64,...)
    const dataUrlPattern = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g
    const matches = [...markdown.matchAll(dataUrlPattern)]

    if (matches.length === 0) {
      return markdown // No pending images
    }

    // Collect all replacements first to avoid race conditions
    const replacements: { original: string; replacement: string }[] = []

    const uploadPromises = matches.map(async (match) => {
      const fullMatch = match[0]
      const alt = match[1]
      const dataUrl = match[2]

      try {
        // Extract base64 content and mime type
        const [header, base64] = dataUrl.split(',')
        const mimeMatch = header.match(/data:image\/([^;]+)/)
        let ext = mimeMatch ? mimeMatch[1] : 'png'

        // Handle special MIME types
        if (ext === 'svg+xml') ext = 'svg'
        if (ext === 'jpeg') ext = 'jpg'

        // Generate filename from content hash (SHA-256 for deduplication)
        const hash = await hashBase64Content(base64)
        const filename = `${hash}.${ext}`

        // Upload to GitHub
        const response = await fetch('/api/proxy/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: base64,
            filename,
            space,
            userLogin: user.login,
          }),
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const { url } = await response.json()

        // Store replacement for later application
        // Use filename as alt text if original alt is empty
        const altText = alt || filename
        replacements.push({
          original: fullMatch,
          replacement: `![${altText}](${url})`,
        })
      } catch (error) {
        console.error('Failed to upload image:', error)
        // Keep the data URL if upload fails - user can retry
        toast.error('Some images failed to upload')
      }
    })

    await Promise.all(uploadPromises)

    // Apply all replacements after all uploads complete
    let result = markdown
    for (const { original, replacement } of replacements) {
      result = result.replace(original, replacement)
    }

    return result
  }

  /**
   * Check if markdown contains pending (unuploaded) images
   */
  const hasPendingImages = (markdown: string): boolean => {
    return /data:image\/[^;]+;base64,/.test(markdown)
  }

  return {
    insertLocalImage,
    uploadPendingImages,
    hasPendingImages,
  }
}

// Helper to convert File to data URL (keeps the data:image/xxx;base64, prefix)
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper to hash base64 content using SHA-256 for deduplication
async function hashBase64Content(base64: string): Promise<string> {
  // Decode base64 to binary
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Return first 16 chars (64 bits) - enough for uniqueness, shorter filename
  return hashHex.slice(0, 16)
}
