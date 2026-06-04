import { eachDayOfInterval, format, subDays } from "date-fns";
import {
  effectiveDurationSec,
  normalizeWorkoutDate,
} from "@/lib/training/normalize";

export interface WorkoutLoadInput {
  date: string;
  tss: number | null;
  duration_sec: number | null;
  discipline: string;
  raw_data?: unknown;
}

export interface LoadMetricsPoint {
  date: string;
  tss: number;
  atl: number;
  ctl: number;
  tsb: number;
}

const TAU_CTL = 42;
const TAU_ATL = 7;

export function estimateTss(workout: WorkoutLoadInput): number {
  if (workout.tss != null && workout.tss > 0) {
    return Number(workout.tss);
  }
  const durationSec = effectiveDurationSec(
    workout.duration_sec,
    workout.raw_data
  );
  const hours = durationSec / 3600;
  if (hours <= 0) return 0;
  const multipliers: Record<string, number> = {
    swim: 55,
    bike: 45,
    run: 50,
    gym: 35,
    race: 70,
  };
  const perHour = multipliers[workout.discipline] ?? 45;
  return Math.round(hours * perHour);
}

export function computeLoadMetrics(
  workouts: WorkoutLoadInput[],
  daysBack = 90
): LoadMetricsPoint[] {
  const end = new Date();
  const start = subDays(end, daysBack);
  const days = eachDayOfInterval({ start, end });

  const tssByDate = new Map<string, number>();
  for (const w of workouts) {
    const d = normalizeWorkoutDate(w.date);
    if (!d) continue;
    const tss = estimateTss(w);
    tssByDate.set(d, (tssByDate.get(d) ?? 0) + tss);
  }

  let ctl = 0;
  let atl = 0;
  const points: LoadMetricsPoint[] = [];

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    const dailyTss = tssByDate.get(dateStr) ?? 0;
    ctl = ctl + (dailyTss - ctl) / TAU_CTL;
    atl = atl + (dailyTss - atl) / TAU_ATL;
    points.push({
      date: dateStr,
      tss: dailyTss,
      atl: Math.round(atl),
      ctl: Math.round(ctl),
      tsb: Math.round(ctl - atl),
    });
  }

  return points;
}

export function getLatestMetrics(points: LoadMetricsPoint[]) {
  const last = points[points.length - 1];
  return last ?? { atl: 0, ctl: 0, tsb: 0, tss: 0, date: format(new Date(), "yyyy-MM-dd") };
}
