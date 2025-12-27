import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlatformKey() {
  if (typeof navigator === "undefined") {
    return "Ctrl";
  }
  const ua = navigator.userAgent;
  const isMac = /Mac|iPod|iPhone|iPad/.test(ua);
  return isMac ? "⌘" : "Ctrl";
}
