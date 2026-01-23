import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/lib/client/db";

/**
 * Hook to fetch and filter notes from local database
 *
 * Handles:
 * - Date filtering
 * - Search query matching (content and tags)
 * - Sorted by date descending
 * - Trash view support
 *
 * @param searchQuery - Search query string
 * @param filterDate - Date filter (ISO date string)
 * @param isInTrash - Whether to show deleted notes (default: false)
 * @returns Filtered notes array or undefined during loading
 */
export function useNotes(
  searchQuery = "",
  filterDate = "",
  isInTrash = false,
  filterTemplates = false
) {
  const notes = useLiveQuery(async () => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    // Optimization: Default view
    if (!lowerQuery && !filterDate.trim()) {
      // Fetch all, sort by date desc
      const collection = db.notes.orderBy("date").reverse();

      return collection
        .filter((n) => {
          if (!!n.deleted !== isInTrash) {
            return false;
          }
          if (filterTemplates && !n.isTemplate) {
            return false;
          }
          return true;
        })
        .toArray();
    }

    const isTagSearch = lowerQuery.startsWith("#") && lowerQuery.length > 1;

    let filteredNotes: any[] = [];

    // Optimization: For tag searches, use the tags index
    if (isTagSearch) {
      const tagToSearch = lowerQuery.slice(1);

      const notesByTag = await db.notes
        .where("tags")
        .startsWithIgnoreCase(tagToSearch)
        .distinct()
        .toArray();

      filteredNotes = notesByTag;

      if (filterDate.trim()) {
        const targetDate = new Date(filterDate);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        filteredNotes = filteredNotes.filter((note) => {
          const noteDate = new Date(note.createdAt);
          return noteDate >= startOfDay && noteDate <= endOfDay;
        });
      }

      // Filter by deleted status
      filteredNotes = filteredNotes.filter((n) => !!n.deleted === isInTrash);

      // Sort by date descending
      return filteredNotes.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Default strategy: Filter on collection
    let collection = db.notes.toCollection();

    // Apply deleted filter
    collection = collection.filter((n) => !!n.deleted === isInTrash);

    // Date filtering
    if (filterDate.trim()) {
      const targetDate = new Date(filterDate);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      collection = collection.filter((note) => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= startOfDay && noteDate <= endOfDay;
      });
    }

    // Content/Partial Tag filtering
    if (searchQuery.trim()) {
      collection = collection.filter((note) => {
        // Search in content
        if (note.content.toLowerCase().includes(lowerQuery)) {
          return true;
        }

        // Search in tags (without # prefix)
        if (note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
          return true;
        }

        return false;
      });
    }

    // Sort by date
    const sortedNotes = await collection.sortBy("date");
    return sortedNotes.reverse();
  }, [searchQuery, filterDate, isInTrash, filterTemplates]);

  return notes;
}

interface UseNoteSearchOptions {
  searchQuery: string;
}

/**
 * Hook to search notes by query (content and tags)
 */
export function useNoteSearch({ searchQuery }: UseNoteSearchOptions) {
  const notes = useLiveQuery(async () => {
    const lowerQuery = searchQuery.trim().toLowerCase();
    const isTagSearch = lowerQuery.startsWith("#") && lowerQuery.length > 1;

    if (isTagSearch) {
      const tagToSearch = lowerQuery.slice(1);
      const notesByTag = await db.notes
        .where("tags")
        .startsWithIgnoreCase(tagToSearch)
        .distinct()
        .toArray();

      return notesByTag.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    let collection = db.notes.toCollection();

    if (searchQuery.trim()) {
      collection = collection.filter((note) => {
        const contentMatch = note.content.toLowerCase().includes(lowerQuery);
        const tagMatch = note.tags.some((tag) =>
          tag.toLowerCase().includes(lowerQuery)
        );
        return contentMatch || tagMatch;
      });
    }

    const sortedNotes = await collection.sortBy("date");
    return sortedNotes.reverse();
  }, [searchQuery]);

  return notes;
}
