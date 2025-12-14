import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/client/db'

/**
 * Hook to fetch and filter notes from local database
 * 
 * Handles:
 * - Date filtering
 * - Search query matching (content and tags)
 * - Sorted by date descending
 * 
 * @param space - Space name (without .marlin suffix)
 * @param searchQuery - Search query string
 * @param filterDate - Date filter (ISO date string)
 * @returns Filtered notes array or undefined during loading
 */
export function useNotes(space: string, searchQuery = '', filterDate = '') {
  const notes = useLiveQuery(
    async () => {
      const allNotes = await db.notes
        .where('space')
        .equals(space)
        .reverse()
        .sortBy('date')

      let filteredNotes = allNotes

      // Date filtering
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

      // Search query filtering
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.trim().toLowerCase()

        filteredNotes = filteredNotes.filter((note) => {
          // Search in tags if query starts with #
          if (lowerQuery.startsWith('#')) {
            const tagToSearch = lowerQuery.slice(1)
            return note.tags.some((tag) => tag.toLowerCase().includes(tagToSearch))
          }

          // Search in content
          if (note.content.toLowerCase().includes(lowerQuery)) return true

          // Search in tags (without # prefix)
          if (note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true

          return false
        })
      }

      return filteredNotes
    },
    [space, searchQuery, filterDate]
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
      const allNotes = await db.notes
        .where('space')
        .equals(spaceId)
        .reverse()
        .sortBy('date')

      if (!searchQuery.trim()) {
        return allNotes
      }

      const query = searchQuery.toLowerCase()
      
      return allNotes.filter(note => {
        const contentMatch = note.content.toLowerCase().includes(query)
        const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(query))
        return contentMatch || tagMatch
      })
    },
    [spaceId, searchQuery]
  )

  return notes
}
