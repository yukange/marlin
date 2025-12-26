/**
 * Date Utilities (Utility Layer)
 *
 * Responsibilities:
 * - Format timestamps for display
 * - Convert between date formats
 * - Pure functions with no side effects
 */

import {
  format,
  isToday,
  isYesterday,
  isThisYear,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";

/**
 * Format Unix timestamp to human-readable date
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "Dec 5, 2025")
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

/**
 * Format Unix timestamp using hybrid time strategy
 * Optimized for chat-like stream interface
 *
 * Rules:
 * - < 1 minute: "Just now"
 * - < 1 hour: "5m ago"
 * - < 24 hours: "2h ago"
 * - Today: "10:30 AM"
 * - Yesterday: "Yesterday 10:30 AM"
 * - This year: "Nov 25"
 * - Previous years: "Dec 12, 2024"
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string for display
 */
export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const minutesDiff = differenceInMinutes(now, date);
  const hoursDiff = differenceInHours(now, date);

  // < 1 minute
  if (minutesDiff < 1) {
    return "Just now";
  }

  // < 1 hour
  if (minutesDiff < 60) {
    return `${minutesDiff}m ago`;
  }

  // Today: show specific time (prioritize over hoursDiff)
  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  // Yesterday
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  }

  // Within 24 hours but not today/yesterday (edge case: late night cross-day)
  if (hoursDiff < 24) {
    return `${hoursDiff}h ago`;
  }

  // This year
  if (isThisYear(date)) {
    return format(date, "MMM d");
  }

  // Previous years
  return format(date, "MMM d, yyyy");
}

/**
 * Format Unix timestamp to precise absolute time
 * Used for tooltip to show exact timestamp
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Full timestamp string (e.g., "2025-12-12 11:24:30")
 */
export function formatPreciseTime(timestamp: number): string {
  return format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss");
}

/**
 * Format Unix timestamp to ISO date string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO date string (e.g., "2025-12-05")
 */
export function toISODate(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

/**
 * Get start of day timestamp
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Timestamp at 00:00:00 of the same day
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get end of day timestamp
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Timestamp at 23:59:59.999 of the same day
 */
export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Check if two timestamps are on the same day
 *
 * @param timestamp1 - First Unix timestamp
 * @param timestamp2 - Second Unix timestamp
 * @returns true if both timestamps are on the same calendar day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  return toISODate(timestamp1) === toISODate(timestamp2);
}
