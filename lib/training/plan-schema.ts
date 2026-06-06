import { addDays, format, parseISO, startOfWeek } from "date-fns";

export const PLAN_JSON_VERSION = 1;

export const VALID_DISCIPLINES = [
  "swim",
  "bike",
  "run",
  "gym",
  "race",
  "brick",
  "rest",
] as const;

export type PlanDiscipline = (typeof VALID_DISCIPLINES)[number];

export interface PlanIntervalStep {
  type?: string;
  duration_min?: number;
  distance_m?: number;
  zone?: string;
  notes?: string;
}

export interface PlanWorkoutInput {
  date?: string;
  day?: string;
  discipline: string;
  title: string;
  description?: string;
  duration_min?: number;
  distance_km?: number;
  distance_m?: number;
  target_tss?: number;
  intensity?: string;
  structure?: PlanIntervalStep[];
}

export interface TrainingPlanJson {
  version?: number;
  plan_name: string;
  week_start: string;
  week_notes?: string;
  workouts: PlanWorkoutInput[];
}

export interface ParsedPlanWorkout {
  date: string;
  discipline: PlanDiscipline;
  title: string;
  description: string | null;
  duration_min: number | null;
  distance_m: number | null;
  target_tss: number | null;
  intensity: string | null;
  structure: PlanIntervalStep[];
}

const DAY_OFFSET: Record<string, number> = {
  monday: 0,
  mon: 0,
  tuesday: 1,
  tue: 1,
  dienstag: 1,
  wednesday: 2,
  wed: 2,
  mittwoch: 2,
  thursday: 3,
  thu: 3,
  donnerstag: 3,
  friday: 4,
  fri: 4,
  freitag: 4,
  saturday: 5,
  sat: 5,
  samstag: 5,
  sunday: 6,
  sun: 6,
  sonntag: 6,
};

function normalizeDiscipline(raw: string): PlanDiscipline | null {
  const d = raw.trim().toLowerCase();
  if (d === "swimming" || d === "schwimmen") return "swim";
  if (d === "cycling" || d === "rad" || d === "bike") return "bike";
  if (d === "running" || d === "lauf" || d === "run") return "run";
  if (d === "strength" || d === "kraft" || d === "gym") return "gym";
  if (d === "race" || d === "wettkampf") return "race";
  if (d === "brick" || d === "zweikampf") return "brick";
  if (d === "rest" || d === "ruhe" || d === "ruhetag" || d === "off") return "rest";
  if (VALID_DISCIPLINES.includes(d as PlanDiscipline)) {
    return d as PlanDiscipline;
  }
  return null;
}

function resolveWorkoutDate(
  workout: PlanWorkoutInput,
  weekStart: string
): string | null {
  if (workout.date) {
    return workout.date.slice(0, 10);
  }
  if (workout.day) {
    const key = workout.day.trim().toLowerCase();
    const offset = DAY_OFFSET[key];
    if (offset === undefined) return null;
    const monday = startOfWeek(parseISO(weekStart), { weekStartsOn: 1 });
    return format(addDays(monday, offset), "yyyy-MM-dd");
  }
  return null;
}

export function parseTrainingPlanJson(
  data: unknown
): { plan: TrainingPlanJson; workouts: ParsedPlanWorkout[] } {
  if (!data || typeof data !== "object") {
    throw new Error("Ungültiges JSON: Objekt erwartet");
  }

  const raw = data as TrainingPlanJson;

  if (!raw.plan_name?.trim()) {
    throw new Error("plan_name fehlt");
  }
  if (!raw.week_start) {
    throw new Error("week_start fehlt (yyyy-MM-dd, Montag der Woche)");
  }

  const weekStart = raw.week_start.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    throw new Error("week_start muss yyyy-MM-dd sein");
  }

  if (!Array.isArray(raw.workouts) || raw.workouts.length === 0) {
    throw new Error("workouts Array fehlt oder ist leer");
  }

  const workouts: ParsedPlanWorkout[] = [];

  for (let i = 0; i < raw.workouts.length; i++) {
    const w = raw.workouts[i];
    const discipline = normalizeDiscipline(w.discipline ?? "");
    if (!discipline) {
      throw new Error(
        `Workout ${i + 1}: discipline ungültig (${w.discipline}). Erlaubt: swim, bike, run, gym, race, brick, rest`
      );
    }
    if (!w.title?.trim()) {
      throw new Error(`Workout ${i + 1}: title fehlt`);
    }

    const date = resolveWorkoutDate(w, weekStart);
    if (!date) {
      throw new Error(
        `Workout ${i + 1}: date oder day (monday…sunday) angeben`
      );
    }

    let distance_m: number | null = null;
    if (w.distance_m != null) distance_m = Math.round(w.distance_m);
    else if (w.distance_km != null)
      distance_m = Math.round(w.distance_km * 1000);

    workouts.push({
      date,
      discipline,
      title: w.title.trim(),
      description: w.description?.trim() ?? null,
      duration_min:
        w.duration_min != null ? Math.round(w.duration_min) : null,
      distance_m,
      target_tss:
        w.target_tss != null ? Math.round(w.target_tss * 10) / 10 : null,
      intensity: w.intensity?.trim() ?? null,
      structure: Array.isArray(w.structure) ? w.structure : [],
    });
  }

  return {
    plan: {
      version: raw.version ?? PLAN_JSON_VERSION,
      plan_name: raw.plan_name.trim(),
      week_start: weekStart,
      week_notes: raw.week_notes?.trim(),
      workouts: raw.workouts,
    },
    workouts,
  };
}

export function weekEndFromStart(weekStart: string): string {
  const monday = parseISO(weekStart);
  return format(addDays(monday, 6), "yyyy-MM-dd");
}
