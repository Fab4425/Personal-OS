import { format } from "date-fns";

/** Garmin liefert oft "2026-06-07 10:30:00" oder ISO mit "T". */
export function parseGarminActivityDate(startTimeLocal: string): string {
  if (!startTimeLocal) return format(new Date(), "yyyy-MM-dd");
  const part = startTimeLocal.includes("T")
    ? startTimeLocal.split("T")[0]
    : startTimeLocal.split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  const parsed = new Date(startTimeLocal);
  if (!Number.isNaN(parsed.getTime())) return format(parsed, "yyyy-MM-dd");
  return format(new Date(), "yyyy-MM-dd");
}
