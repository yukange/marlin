"use client"

import { useRef, useEffect, useState, useCallback } from 'react';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { cn } from '@/lib/utils';

interface CalendarBarProps {
    space: string;
    visibleDate?: string | null; // Date of currently visible note in stream
    onScrollToDate?: (date: string) => void; // Callback to scroll note stream to date
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

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export function CalendarBar({ space, visibleDate, onScrollToDate }: CalendarBarProps) {
    const data = useCalendarData(space, 6);
    const containerRef = useRef<HTMLElement>(null);
    const dateRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Flag to prevent auto-scroll when programmatic scroll is happening
    const isProgrammaticScroll = useRef(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // Auto-scroll to visible date when it changes (from NoteStream scroll)
    useEffect(() => {
        if (!visibleDate || !containerRef.current || isUserScrolling) return;

        const dateElement = dateRefs.current.get(visibleDate);
        if (dateElement) {
            isProgrammaticScroll.current = true;
            dateElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            // Reset flag after scroll completes
            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 500);
        }
    }, [visibleDate, isUserScrolling]);

    // Handle calendar scroll - detect center date and sync to NoteStream
    const handleCalendarScroll = useCallback(
        debounce(() => {
            if (isProgrammaticScroll.current || !containerRef.current || !onScrollToDate) return;

            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const centerY = containerRect.top + containerRect.height / 2;

            // Find the date element closest to center
            let closestDate: string | null = null;
            let closestDistance = Infinity;

            dateRefs.current.forEach((element, date) => {
                const rect = element.getBoundingClientRect();
                const elementCenterY = rect.top + rect.height / 2;
                const distance = Math.abs(elementCenterY - centerY);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestDate = date;
                }
            });

            if (closestDate) {
                onScrollToDate(closestDate);
            }
        }, 150),
        [onScrollToDate]
    );

    // Track user scrolling state
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scrollTimeout: ReturnType<typeof setTimeout>;

        const handleScrollStart = () => {
            if (!isProgrammaticScroll.current) {
                setIsUserScrolling(true);
            }
        };

        const handleScrollEnd = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setIsUserScrolling(false);
            }, 200);
        };

        const handleScroll = () => {
            handleScrollStart();
            handleScrollEnd();
            handleCalendarScroll();
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [handleCalendarScroll]);

    if (!data || data.length === 0) {
        return null;
    }

    // Click to navigate (scroll to date), not filter
    const handleDateClick = (date: string) => {
        if (onScrollToDate) {
            onScrollToDate(date);
        }
    };

    return (
        <aside
            ref={containerRef}
            className="w-[140px] h-full overflow-y-auto py-4 pr-2 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
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
                                const isVisible = visibleDate === day.date;

                                return (
                                    <button
                                        key={day.date}
                                        ref={(el) => {
                                            if (el) dateRefs.current.set(day.date, el);
                                            else dateRefs.current.delete(day.date);
                                        }}
                                        onClick={() => handleDateClick(day.date)}
                                        className={cn(
                                            "group relative flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors",
                                            "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                                            isVisible && "bg-amber-50 dark:bg-amber-950/20",
                                            day.isToday && "font-semibold"
                                        )}
                                    >
                                        {/* Visible indicator line (scroll sync) */}
                                        {isVisible && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-500 dark:bg-amber-400 rounded-full" />
                                        )}

                                        {/* Today indicator */}
                                        {day.isToday && !isVisible && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-red-500 rounded-full" />
                                        )}

                                        {/* Day of week */}
                                        <span className={cn(
                                            "w-3 text-zinc-400 dark:text-zinc-500",
                                            isVisible && "text-amber-600 dark:text-amber-400",
                                            day.isToday && !isVisible && "text-red-500 dark:text-red-400"
                                        )}>
                                            {day.dayOfWeek}
                                        </span>

                                        {/* Day number */}
                                        <span className={cn(
                                            "w-5 text-right text-zinc-600 dark:text-zinc-400",
                                            isVisible && "text-amber-600 dark:text-amber-400",
                                            day.isToday && !isVisible && "text-red-500 dark:text-red-400"
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
