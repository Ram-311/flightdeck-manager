import { clsx, type ClassValue } from "clsx";
import { format, intervalToDuration } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateTime(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatDuration(start: string, end: string) {
  const duration = intervalToDuration({ start: new Date(start), end: new Date(end) });
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;
  return `${hours}h ${minutes}m`;
}

export function makeSearchParams(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}
