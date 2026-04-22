import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shorten long IDs for display, e.g. `IzeOAfP5...eEN2`. */
export function shortenUserId(id: string, head = 8, tail = 4): string {
  if (!id || id.length <= head + tail + 3) return id;
  return `${id.slice(0, head)}...${id.slice(-tail)}`;
}

export function isRowNavExcluded(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-row-nav-exclude]") != null;
}
