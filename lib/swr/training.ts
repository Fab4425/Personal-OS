import { mutate } from "swr";

export const trainingDashboardKey = (week?: string | null) =>
  week
    ? `/api/training/dashboard?week=${encodeURIComponent(week)}`
    : "/api/training/dashboard";

export async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Anfrage fehlgeschlagen"
    );
  }
  return data as T;
}

/** Stale-while-revalidate: alle Training-Daten im Hintergrund neu laden */
export function revalidateTraining(week?: string | null) {
  return mutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith("/api/training/dashboard") ||
        key.startsWith("/api/training/plan")),
    undefined,
    { revalidate: true }
  ).then(() => {
    if (week) {
      return mutate(trainingDashboardKey(week));
    }
  });
}
