"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHeatmapData } from "@/hooks/use-heatmap-data";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  space: string;
}

function getColorClass(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 0:
      return "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800";
    case 1:
      return "bg-indigo-200 dark:bg-indigo-900/50 hover:bg-indigo-300 dark:hover:bg-indigo-900/70";
    case 2:
      return "bg-indigo-400 dark:bg-indigo-700/60 hover:bg-indigo-500 dark:hover:bg-indigo-700/80";
    case 3:
      return "bg-indigo-600 dark:bg-indigo-500/80 hover:bg-indigo-700 dark:hover:bg-indigo-500";
  }
}

export function Heatmap({ space }: HeatmapProps) {
  const data = useHeatmapData(space);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");

  if (!data || data.length === 0) {
    return null;
  }

  const handleClick = (date: string) => {
    if (selectedDate === date) {
      router.push(pathname);
    } else {
      const params = new URLSearchParams(searchParams);
      params.set("date", date);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="w-full">
      <TooltipProvider delayDuration={100}>
        <div className="grid grid-rows-7 grid-flow-col gap-[8px]">
          {data.map((day) => {
            const isSelected = selectedDate === day.date;
            return (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleClick(day.date)}
                    className={cn(
                      "w-4 h-4 rounded-sm transition-all cursor-pointer",
                      getColorClass(day.level),
                      isSelected &&
                        "ring-2 ring-offset-1 ring-black dark:ring-white"
                    )}
                    aria-label={`${day.date}: ${day.count} notes`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>
                    {day.date}: {day.count} {day.count === 1 ? "note" : "notes"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
