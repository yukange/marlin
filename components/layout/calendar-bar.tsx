"use client"

import { useCalendarData } from '@/hooks/use-calendar-data';
import { cn } from '@/lib/utils';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface CalendarBarProps {
    space: string;
}

function ActivityDots({ count }: { count: number }) {
    if (count === 0) return null;

    // Max 3 dots
    const dots = Math.min(count, 3);

    return (
        <div className="flex gap-0.5 ml-auto">
            {Array.from({ length: dots }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "w-1 h-1 rounded-full",
                        count === 1 && "bg-zinc-400 dark:bg-zinc-500",
                        count === 2 && "bg-indigo-400 dark:bg-indigo-500",
                        count >= 3 && "bg-indigo-500 dark:bg-indigo-400"
                    )}
                />
            ))}
        </div>
    );
}

export function CalendarBar({ space }: CalendarBarProps) {
    const data = useCalendarData(space, 6);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const selectedDate = searchParams.get('date');

    if (!data || data.length === 0) {
        return null;
    }

    const handleDateClick = (date: string) => {
        const params = new URLSearchParams(searchParams);

        if (selectedDate === date) {
            // Toggle off if clicking the same date
            params.delete('date');
        } else {
            params.set('date', date);
        }

        // Preserve other params like search query
        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    return (
        <aside className="w-[140px] h-full overflow-y-auto py-4 pr-2 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex flex-col gap-1">
                {data.map((month) => (
                    <div key={month.label}>
                        {/* Month Header */}
                        <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-2 sticky top-0 bg-white dark:bg-zinc-950 z-10">
                            {month.label}
                        </div>

                        {/* Days */}
                        <div className="flex flex-col">
                            {month.days.map((day) => {
                                const isSelected = selectedDate === day.date;

                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => handleDateClick(day.date)}
                                        className={cn(
                                            "group relative flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors",
                                            "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                                            isSelected && "bg-indigo-50 dark:bg-indigo-950/30",
                                            day.isToday && "font-semibold"
                                        )}
                                    >
                                        {/* Selection indicator line */}
                                        {isSelected && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                                        )}

                                        {/* Today indicator */}
                                        {day.isToday && !isSelected && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-red-500 rounded-full" />
                                        )}

                                        {/* Day of week */}
                                        <span className={cn(
                                            "w-3 text-zinc-400 dark:text-zinc-500",
                                            isSelected && "text-indigo-600 dark:text-indigo-400",
                                            day.isToday && "text-red-500 dark:text-red-400"
                                        )}>
                                            {day.dayOfWeek}
                                        </span>

                                        {/* Day number */}
                                        <span className={cn(
                                            "w-5 text-right text-zinc-600 dark:text-zinc-400",
                                            isSelected && "text-indigo-600 dark:text-indigo-400",
                                            day.isToday && "text-red-500 dark:text-red-400"
                                        )}>
                                            {day.dayOfMonth}
                                        </span>

                                        {/* Activity dots */}
                                        <ActivityDots count={day.count} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
