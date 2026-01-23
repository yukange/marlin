import {
  format,
  subMonths,
  startOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type Note } from "@/lib/client/db";

export interface CalendarDay {
  date: string; // 'yyyy-MM-dd'
  dayOfMonth: number; // 1-31
  dayOfWeek: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  count: number; // Number of notes on this day
  isToday: boolean;
}

export interface CalendarMonth {
  label: string; // 'Dec 2024'
  days: CalendarDay[];
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Hook to fetch calendar data for the repository
 * Range: from earliest note's month start OR 3 months ago (whichever is earlier) to today
 */
export function useCalendarData() {
  return useLiveQuery(async () => {
    const today = new Date();
    
    // Find the earliest note
    const earliestNote = await db.notes
      .filter((note: Note) => !note.deleted)
      .reverse()
      .sortBy("createdAt")
      .then((notes) => notes[0]);
    
    // Calculate start date:
    // - If no notes: use 3 months ago
    // - If earliest note is within 3 months: use 3 months ago (1st of that month)
    // - If earliest note is older than 3 months: use earliest note's month (1st of that month)
    const threeMonthsAgoStart = startOfMonth(subMonths(today, 3));
    
    let startDate: Date;
    if (!earliestNote) {
      // No notes, show last 3 months
      startDate = threeMonthsAgoStart;
    } else {
      const earliestNoteMonthStart = startOfMonth(new Date(earliestNote.createdAt));
      // Use the earlier of: earliest note's month start or 3 months ago
      startDate = earliestNoteMonthStart < threeMonthsAgoStart 
        ? earliestNoteMonthStart 
        : threeMonthsAgoStart;
    }
    
    const endDate = today; // Only show up to today

    // Fetch notes in date range for counting
    const notes = await db.notes
      .filter(
        (note: Note) =>
          !note.deleted &&
          note.createdAt >= startDate.getTime() &&
          note.createdAt <= endDate.getTime()
      )
      .toArray();

    // Count notes per day
    const countMap = new Map<string, number>();
    notes.forEach((note: Note) => {
      const dateStr = format(note.createdAt, "yyyy-MM-dd");
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    });

    // Generate all days in the range, grouped by month
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const monthsMap = new Map<string, CalendarDay[]>();

    allDays.forEach((day) => {
      const monthLabel = format(day, "MMM yyyy");
      const dateStr = format(day, "yyyy-MM-dd");
      const dayOfWeek = day.getDay();

      const calendarDay: CalendarDay = {
        date: dateStr,
        dayOfMonth: day.getDate(),
        dayOfWeek: WEEKDAY_LABELS[dayOfWeek],
        count: countMap.get(dateStr) || 0,
        isToday: isToday(day),
      };

      if (!monthsMap.has(monthLabel)) {
        monthsMap.set(monthLabel, []);
      }
      monthsMap.get(monthLabel)!.push(calendarDay);
    });

    // Convert to array, sorted by date (oldest first, matching NoteStream's flex-col-reverse)
    // This means oldest month at top, newest (today) at bottom
    const result: CalendarMonth[] = [];
    monthsMap.forEach((days, label) => {
      result.push({
        label,
        days, // Days already in chronological order (oldest first)
      });
    });

    return result; // Months already in chronological order (oldest first)
  }, []);
}
