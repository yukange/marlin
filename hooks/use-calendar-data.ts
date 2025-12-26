import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/lib/client/db';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';

export interface CalendarDay {
    date: string;        // 'yyyy-MM-dd'
    dayOfMonth: number;  // 1-31
    dayOfWeek: string;   // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
    count: number;       // Number of notes on this day
    isToday: boolean;
}

export interface CalendarMonth {
    label: string;       // 'Dec 2024'
    days: CalendarDay[];
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Hook to fetch calendar data for a space
 * Returns data grouped by month, for the last N months
 * @param space - Space name (e.g., "work")
 * @param monthsBack - Number of months to fetch (default: 6)
 */
export function useCalendarData(space: string, monthsBack: number = 6) {
    return useLiveQuery(async () => {
        if (!space) return [];

        const today = new Date();
        const startDate = startOfMonth(subMonths(today, monthsBack - 1));
        const endDate = today; // Only show up to today, not the rest of the month

        // Fetch notes in date range
        const notes = await db.notes
            .where('space')
            .equals(space)
            .and((note: Note) =>
                !note.deleted &&
                note.createdAt >= startDate.getTime() &&
                note.createdAt <= endDate.getTime()
            )
            .toArray();

        // Count notes per day
        const countMap = new Map<string, number>();
        notes.forEach((note: Note) => {
            const dateStr = format(note.createdAt, 'yyyy-MM-dd');
            countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
        });

        // Generate all days in the range, grouped by month
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        const monthsMap = new Map<string, CalendarDay[]>();

        allDays.forEach(day => {
            const monthLabel = format(day, 'MMM yyyy');
            const dateStr = format(day, 'yyyy-MM-dd');
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
    }, [space, monthsBack]);
}
