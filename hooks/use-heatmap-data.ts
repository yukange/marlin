import { startOfWeek, endOfWeek, subWeeks, format, addDays } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type Note } from "@/lib/client/db";

interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3;
}

/**
 * Hook to fetch heatmap data for a space
 * @param space - Space name without .marlin suffix (e.g., "work")
 */
export function useHeatmapData(space: string) {
  return useLiveQuery(async () => {
    if (!space) {
      return [];
    }

    const today = new Date();
    const endDate = endOfWeek(today, { weekStartsOn: 0 });
    const startDate = startOfWeek(subWeeks(endDate, 11), { weekStartsOn: 1 });

    const notes = await db.notes
      .where("space")
      .equals(space)
      .and(
        (note: Note) =>
          note.createdAt >= startDate.getTime() &&
          note.createdAt <= endDate.getTime()
      )
      .toArray();

    const countMap = new Map<string, number>();
    notes.forEach((note: Note) => {
      const dateStr = format(note.createdAt, "yyyy-MM-dd");
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    });

    const result: HeatmapDay[] = [];
    let currentDate = startDate;

    for (let week = 0; week < 12; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const count = countMap.get(dateStr) || 0;

        let level: 0 | 1 | 2 | 3;
        if (count === 0) {
          level = 0;
        } else if (count <= 2) {
          level = 1;
        } else if (count <= 5) {
          level = 2;
        } else {
          level = 3;
        }

        result.push({ date: dateStr, count, level });
        currentDate = addDays(currentDate, 1);
      }
    }

    return result;
  }, [space]);
}
