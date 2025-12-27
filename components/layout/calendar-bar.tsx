"use client";

import { useRef, useEffect, useState } from "react";

import { useCalendarData } from "@/hooks/use-calendar-data";
import { cn } from "@/lib/utils";

interface CalendarBarProps {
  space: string;
  visibleDate?: string | null; // Which date's notes are currently visible in NoteStream
}

function ActivityDots({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

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

export function CalendarBar({
  space,
  visibleDate,
}: CalendarBarProps) {
  const data = useCalendarData(space);
  const containerRef = useRef<HTMLElement>(null);
  const dateRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Auto-scroll calendar to show the visible date (when NoteStream scrolls)
  useEffect(() => {
    // Don't auto-scroll if user is manually scrolling the calendar
    if (!visibleDate || !containerRef.current || isUserScrolling) {
      return;
    }

    const dateElement = dateRefs.current.get(visibleDate);
    if (dateElement) {
      dateElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [visibleDate, isUserScrolling]);

  // Track user scrolling state to prevent auto-scroll interference
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000); // Wait 1 second after scroll stops before allowing auto-scroll
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (!data || data.length === 0) {
    return null;
  }

  // Click to navigate - dispatch event to NoteStream
  const handleDateClick = (date: string, count: number) => {
    // Don't navigate to dates without notes
    if (count === 0) {
      return;
    }
    
    // Dispatch custom event that NoteStream listens for
    window.dispatchEvent(
      new CustomEvent("calendar:scrollToDate", { detail: date })
    );
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
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider px-2 py-2 sticky top-0 bg-white dark:bg-zinc-950 z-10">
              {month.label}
            </div>

            {/* Days */}
            <div className="flex flex-col">
              {month.days.map((day) => {
                const isVisible = visibleDate === day.date;
                const hasNotes = day.count > 0;

                return (
                  <button
                    key={day.date}
                    ref={(el) => {
                      if (el) {
                        dateRefs.current.set(day.date, el);
                      } else {
                        dateRefs.current.delete(day.date);
                      }
                    }}
                    onClick={() => handleDateClick(day.date, day.count)}
                    className={cn(
                      "group relative flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors",
                      hasNotes && "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer",
                      !hasNotes && "cursor-default opacity-50",
                      isVisible && "bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-200 dark:ring-indigo-800",
                      day.isToday && "font-semibold"
                    )}
                  >
                    {/* Visible date indicator line */}
                    {isVisible && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                    )}

                    {/* Today indicator */}
                    {day.isToday && !isVisible && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-red-500 rounded-full" />
                    )}

                    {/* Day of week */}
                    <span
                      className={cn(
                        "w-3 text-zinc-400 dark:text-zinc-500",
                        isVisible && "text-indigo-600 dark:text-indigo-400",
                        day.isToday &&
                          !isVisible &&
                          "text-red-500 dark:text-red-400"
                      )}
                    >
                      {day.dayOfWeek}
                    </span>

                    {/* Day number */}
                    <span
                      className={cn(
                        "w-5 text-right text-zinc-600 dark:text-zinc-400",
                        isVisible && "text-indigo-600 dark:text-indigo-400",
                        day.isToday &&
                          !isVisible &&
                          "text-red-500 dark:text-red-400"
                      )}
                    >
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
