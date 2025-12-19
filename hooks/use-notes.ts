import { useLiveQuery } from 'dexie-react-hooks'
import Dexie from 'dexie'
import { db } from '@/lib/client/db'

/**
 * Hook to fetch and filter notes from local database
 * 
 * Handles:
 * - Date filtering
 * - Search query matching (content and tags)
 * - Sorted by date descending
 * - Trash view support
 * 
 * @param space - Space name (without .marlin suffix)
 * @param searchQuery - Search query string
 * @param filterDate - Date filter (ISO date string)
 * @param isInTrash - Whether to show deleted notes (default: false)
 * @returns Filtered notes array or undefined during loading
 */
export function useNotes(space: string, searchQuery = '', filterDate = '', isInTrash = false, filterTemplates = false) {
  const notes = useLiveQuery(
    async () => {
      const lowerQuery = searchQuery.trim().toLowerCase()

      // Optimization: Default view (Space Only)
      // Use compound index [space+date] to fetch sorted results directly from DB engine
      if (!lowerQuery && !filterDate.trim()) {
        const collection = db.notes
          .where('[space+date]')
          .between([space, Dexie.minKey], [space, Dexie.maxKey])
          .reverse()

        // Filter by deleted status and template status
        // Note: Dexie filters are applied in memory after fetching from index, 
        // but it's still faster than full table scan.
        return collection.filter(n => {
          if (!!n.deleted !== isInTrash) return false
          if (filterTemplates && !n.isTemplate) return false
          return true
        }).toArray()
      }

      const isTagSearch = lowerQuery.startsWith('#') && lowerQuery.length > 1

      let filteredNotes: any[] = []

      // Optimization: For tag searches, use the tags index
      if (isTagSearch) {
        const tagToSearch = lowerQuery.slice(1)

        // Use the multi-entry index for tags
        // This is much faster than scanning all notes in the space
        const notesByTag = await db.notes
          .where('tags')
          .startsWithIgnoreCase(tagToSearch)
          .distinct()
          .toArray()

        // Filter by space and date in memory (dataset should be small)
        filteredNotes = notesByTag.filter(note => note.space === space)

        if (filterDate.trim()) {
          const targetDate = new Date(filterDate)
          const startOfDay = new Date(targetDate)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(targetDate)
          endOfDay.setHours(23, 59, 59, 999)

          filteredNotes = filteredNotes.filter((note) => {
            const noteDate = new Date(note.date)
            return noteDate >= startOfDay && noteDate <= endOfDay
          })
        }

        // Filter by deleted status
        filteredNotes = filteredNotes.filter(n => !!n.deleted === isInTrash)

        // Sort by date descending
        return filteredNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      // Default strategy: Filter on collection before materializing
      let collection = db.notes
        .where('space')
        .equals(space)

      // Apply deleted filter
      collection = collection.filter(n => !!n.deleted === isInTrash)

      // Date filtering
      if (filterDate.trim()) {
        const targetDate = new Date(filterDate)
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)

        collection = collection.filter((note) => {
          const noteDate = new Date(note.date)
          return noteDate >= startOfDay && noteDate <= endOfDay
        })
      }

      // Content/Partial Tag filtering
      if (searchQuery.trim()) {
        collection = collection.filter((note) => {
          // Search in content
          if (note.content.toLowerCase().includes(lowerQuery)) return true

          // Search in tags (without # prefix) - fallback for partial matches
          if (note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true

          return false
        })
      }

      // Sort by date (sortBy returns array)
      const sortedNotes = await collection.sortBy('date')
      return sortedNotes.reverse()
    },
    [space, searchQuery, filterDate, isInTrash, filterTemplates]
  )

  return notes
}

interface UseNoteSearchOptions {
  spaceId: string
  searchQuery: string
}

/**
 * Hook to search notes by query (content and tags)
 * 
 * @param spaceId - Space name (without .marlin suffix)
 * @param searchQuery - Search query string
 * @returns Filtered notes array or undefined during loading
 */
export function useNoteSearch({ spaceId, searchQuery }: UseNoteSearchOptions) {
  const notes = useLiveQuery(
    async () => {
      const lowerQuery = searchQuery.trim().toLowerCase()
      const isTagSearch = lowerQuery.startsWith('#') && lowerQuery.length > 1

      if (isTagSearch) {
        const tagToSearch = lowerQuery.slice(1)
        const notesByTag = await db.notes
          .where('tags')
          .startsWithIgnoreCase(tagToSearch)
          .distinct()
          .toArray()

        return notesByTag
          .filter(note => note.space === spaceId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      let collection = db.notes
        .where('space')
        .equals(spaceId)

      if (searchQuery.trim()) {
        collection = collection.filter(note => {
          const contentMatch = note.content.toLowerCase().includes(lowerQuery)
          const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          return contentMatch || tagMatch
        })
      }

      const sortedNotes = await collection.sortBy('date')
      return sortedNotes.reverse()
    },
    [spaceId, searchQuery]
  )

  return notes
}
