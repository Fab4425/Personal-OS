import type { CompletedActivityView } from "@/lib/training/plan-types";

export function groupCompletedByDate(
  activities: CompletedActivityView[]
): Record<string, CompletedActivityView[]> {
  const map: Record<string, CompletedActivityView[]> = {};
  for (const a of activities) {
    if (!map[a.date]) map[a.date] = [];
    map[a.date].push(a);
  }
  return map;
}
