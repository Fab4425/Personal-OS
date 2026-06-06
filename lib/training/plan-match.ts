import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import {
  disciplineParts,
  isComboDiscipline,
} from "@/lib/training/discipline-normalize";
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

function isBrickPlanned(
  planned: { date: string; discipline: string; title?: string },
  allPlanned: { date: string; discipline: string; title?: string }[]
): boolean {
  if (planned.discipline === "brick") return true;
  if (planned.title?.toLowerCase().includes("brick")) return true;
  const day = allPlanned.filter((p) => p.date === planned.date);
  return (
    day.some((p) => p.discipline === "bike") &&
    day.some((p) => p.discipline === "run")
  );
}

function brickMatchOnDay(
  sameDay: CompletedWorkoutRow[]
): CompletedWorkoutRow | null {
  const race = sameDay.filter((w) => w.discipline === "race");
  if (race.length >= 1) return race[0];

  const bike = sameDay.find((w) => w.discipline === "bike");
  const run = sameDay.find((w) => w.discipline === "run");
  if (bike && run) return bike;
  if (bike) return bike;
  if (run) return run;
  return null;
}

function comboMatchOnDay(
  parts: string[],
  sameDay: CompletedWorkoutRow[]
): CompletedWorkoutRow | null {
  if (parts.length === 0) return null;

  const matches = parts.map((part) =>
    sameDay.find((w) => w.discipline === part)
  );
  if (matches.every(Boolean)) return matches[0]!;

  return matches.find(Boolean) ?? null;
}

function sumDurationForParts(
  parts: string[],
  dayWorkouts: CompletedWorkoutRow[]
): number {
  return parts.reduce((sum, part) => {
    const w = dayWorkouts.find((x) => x.discipline === part);
    return sum + (w?.duration_sec ?? 0);
  }, 0);
}

export function matchCompletedWorkout(
  planned: { date: string; discipline: string; title?: string },
  completed: CompletedWorkoutRow[],
  allPlanned: { date: string; discipline: string; title?: string }[] = []
): CompletedWorkoutRow | null {
  const sameDay = completed.filter((w) => w.date === planned.date);
  const direct = sameDay.filter((w) => w.discipline === planned.discipline);
  if (direct.length >= 1) return direct[0];

  if (isComboDiscipline(planned.discipline)) {
    if (planned.discipline === "brick") {
      return brickMatchOnDay(sameDay);
    }
    const parts = disciplineParts(planned.discipline);
    if (parts.length > 1) {
      return comboMatchOnDay(parts, sameDay);
    }
  }

  if (isBrickPlanned(planned, allPlanned)) {
    if (planned.discipline === "bike" || planned.discipline === "run") {
      return brickMatchOnDay(sameDay);
    }
  }

  return null;
}

export async function syncPlannedWorkoutStatus(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<void> {
  const { data: planned } = await supabase
    .from("planned_workouts")
    .select("id, date, discipline, title, duration_min, target_tss")
    .eq("plan_id", planId)
    .eq("user_id", userId);

  if (!planned?.length) return;

  const plannedRows = planned.map((p) => ({
    id: p.id,
    date: String(p.date).slice(0, 10),
    discipline: p.discipline,
    title: p.title ?? undefined,
    duration_min: p.duration_min,
    target_tss: p.target_tss,
  }));

  const dates = Array.from(new Set(plannedRows.map((p) => p.date)));
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

  for (const p of plannedRows) {
    if (p.discipline === "rest") {
      const today = format(new Date(), "yyyy-MM-dd");
      const status = p.date <= today ? "completed" : "planned";
      await supabase
        .from("planned_workouts")
        .update({ status, completed_workout_id: null })
        .eq("id", p.id);
      continue;
    }

    const match = matchCompletedWorkout(p, completed, plannedRows);
    let status: "planned" | "completed" | "partial" = "planned";
    let completed_workout_id: string | null = null;

    if (match) {
      completed_workout_id = match.id;
      const plannedMin = p.duration_min ?? 0;
      let actualSec = match.duration_sec ?? 0;

      if (isComboDiscipline(p.discipline)) {
        const dayWorkouts = completed.filter((w) => w.date === p.date);
        if (p.discipline === "brick") {
          actualSec = sumDurationForParts(["bike", "run"], dayWorkouts);
        } else {
          const parts = disciplineParts(p.discipline);
          if (parts.length > 1) {
            actualSec = sumDurationForParts(parts, dayWorkouts);
          }
        }
      }

      const actualMin = Math.round(actualSec / 60);
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

export async function syncAllPlanStatusesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: plans } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", userId);

  for (const plan of plans ?? []) {
    await syncPlannedWorkoutStatus(supabase, userId, plan.id);
  }
}
