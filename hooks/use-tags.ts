import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/client/db";

export function useTags() {
  const tags = useLiveQuery(async () => {
    const notes = await db.notes.filter((note) => !note.deleted).toArray();

    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }, []);

  return tags || [];
}
