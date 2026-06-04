import { addDays, format, startOfWeek } from "date-fns";

/** Montag als Wochenstart (DE) */
export function getWeekStart(date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function getWeekEnd(weekStart: string): string {
  return format(addDays(new Date(weekStart), 6), "yyyy-MM-dd");
}
