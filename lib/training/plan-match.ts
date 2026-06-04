import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveDurationSec } from "@/lib/training/normalize";

export interface CompletedWorkoutRow {
  id: string;
  date: string;
  discipline: string;
  duration_sec: number | null;
  distance_m: number | null;
  tss: number | null;
  raw_data: unknown;
}

export function matchCompletedWorkout(
  planned: { date: string; discipline: string },
  completed: CompletedWorkoutRow[]
): CompletedWorkoutRow | null {
  const sameDay = completed.filter(
    (w) => w.date === planned.date && w.discipline === planned.discipline
  );
  if (sameDay.length === 1) return sameDay[0];
  if (sameDay.length > 1) return sameDay[0];
  return null;
}

export async function syncPlannedWorkoutStatus(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<void> {
  const { data: planned } = await supabase
    .from("planned_workouts")
    .select("id, date, discipline, duration_min, target_tss")
    .eq("plan_id", planId)
    .eq("user_id", userId);

  if (!planned?.length) return;

  const dates = Array.from(new Set(planned.map((p) => p.date)));
  const minDate = dates.sort()[0];
  const maxDate = dates.sort().at(-1)!;

  const { data: completedRaw } = await supabase
    .from("workouts")
    .select("id, date, discipline, duration_sec, distance_m, tss, raw_data")
    .eq("user_id", userId)
    .gte("date", minDate)
    .lte("date", maxDate);

  const completed: CompletedWorkoutRow[] = (completedRaw ?? []).map((w) => ({
    id: w.id,
    date: String(w.date).slice(0, 10),
    discipline: w.discipline,
    duration_sec: effectiveDurationSec(w.duration_sec, w.raw_data),
    distance_m: w.distance_m,
    tss: w.tss != null ? Number(w.tss) : null,
    raw_data: w.raw_data,
  }));

  for (const p of planned) {
    const match = matchCompletedWorkout(p, completed);
    let status: "planned" | "completed" | "partial" = "planned";
    let completed_workout_id: string | null = null;

    if (match) {
      completed_workout_id = match.id;
      const plannedMin = p.duration_min ?? 0;
      const actualMin = Math.round((match.duration_sec ?? 0) / 60);
      if (plannedMin <= 0 || actualMin >= plannedMin * 0.7) {
        status = "completed";
      } else {
        status = "partial";
      }
    }

    await supabase
      .from("planned_workouts")
      .update({ status, completed_workout_id })
      .eq("id", p.id);
  }
}
