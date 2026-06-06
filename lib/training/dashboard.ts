import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import { computeLoadMetrics } from "@/lib/training/load-metrics";
import {
  effectiveDurationSec,
  normalizeWorkoutDate,
} from "@/lib/training/normalize";
import {
  findBestPlanForDate,
  getTrainingPlanByWeekStart,
} from "@/lib/training/plan-server";
import type {
  CompletedActivityView,
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";

export interface WorkoutFeedItem {
  id: string;
  discipline: string;
  source: string;
  date: string;
  duration_sec: number;
  distance_m: number | null;
  tss: number | null;
  raw_data: unknown;
}

export interface TrainingDashboardData {
  today: string;
  weekStartParam: string | null;
  plan: TrainingPlanView | null;
  plannedWorkouts: PlannedWorkoutView[];
  completedActivities: CompletedActivityView[];
  allPlans: TrainingPlanView[];
  readiness: {
    overall_score: number | null;
    swim_score: number | null;
    bike_score: number | null;
    run_score: number | null;
    recommendation: string | null;
  } | null;
  workouts: WorkoutFeedItem[];
  sleepData: {
    date: string;
    sleep_hours: number | null;
    sleep_quality: number | null;
    hrv_score: number | null;
  }[];
  loadMetrics: ReturnType<typeof computeLoadMetrics>;
  volumeByDiscipline: {
    discipline: string;
    hours: number;
    count: number;
  }[];
  weekWorkoutCount: number;
  totalWeekHours: number;
  todayPlanned: PlannedWorkoutView[];
  todayCompleted: CompletedActivityView[];
}

function toCompletedFromWorkout(w: WorkoutFeedItem): CompletedActivityView {
  const name =
    w.raw_data &&
    typeof w.raw_data === "object" &&
    "activityName" in (w.raw_data as object)
      ? String((w.raw_data as { activityName?: string }).activityName ?? "")
      : null;

  return {
    id: w.id,
    date: w.date,
    discipline: w.discipline,
    source: w.source,
    duration_sec: w.duration_sec,
    distance_m: w.distance_m,
    name,
  };
}

export async function getTrainingDashboard(
  supabase: SupabaseClient,
  userId: string,
  weekStartParam?: string | null
): Promise<TrainingDashboardData> {
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const ninetyAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const rollingWeekStart = format(subDays(new Date(), 6), "yyyy-MM-dd");

  let targetWeek = weekStartParam ?? null;
  if (!targetWeek) {
    const planForToday = await findBestPlanForDate(supabase, userId, today);
    targetWeek = planForToday?.week_start ?? null;
  }

  const [
    { data: readiness },
    { data: workoutsRaw },
    { data: sleepData },
    { data: allPlans },
    planBundle,
  ] = await Promise.all([
    supabase
      .from("readiness_scores")
      .select(
        "overall_score, swim_score, bike_score, run_score, recommendation"
      )
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select(
        "id, discipline, source, date, duration_sec, distance_m, tss, raw_data"
      )
      .eq("user_id", userId)
      .gte("date", ninetyAgo)
      .order("date", { ascending: false }),
    supabase
      .from("daily_health")
      .select("date, sleep_hours, sleep_quality, hrv_score")
      .eq("user_id", userId)
      .gte("date", thirtyAgo)
      .order("date", { ascending: true }),
    supabase
      .from("training_plans")
      .select("id, name, week_start, week_end, week_notes")
      .eq("user_id", userId)
      .order("week_start", { ascending: true }),
    targetWeek
      ? getTrainingPlanByWeekStart(supabase, userId, targetWeek)
      : Promise.resolve({
          plan: null,
          workouts: [],
          completedActivities: [],
        }),
  ]);

  const workouts: WorkoutFeedItem[] = (workoutsRaw ?? []).map((w) => ({
    id: w.id,
    discipline: w.discipline,
    source: w.source,
    date: normalizeWorkoutDate(String(w.date)),
    duration_sec: effectiveDurationSec(w.duration_sec, w.raw_data),
    distance_m: w.distance_m,
    tss: w.tss != null ? Number(w.tss) : null,
    raw_data: w.raw_data,
  }));

  const loadMetrics = computeLoadMetrics(
    workouts.map((w) => ({
      date: w.date,
      tss: w.tss,
      duration_sec: w.duration_sec,
      discipline: w.discipline,
      raw_data: w.raw_data,
    }))
  );

  const weekWorkouts = workouts.filter((w) => w.date >= rollingWeekStart);
  const totalWeekHours =
    Math.round(
      (weekWorkouts.reduce((s, w) => s + w.duration_sec, 0) / 3600) * 10
    ) / 10;

  const volumeByDiscipline = ["swim", "bike", "run", "gym"].map((d) => ({
    discipline: d,
    hours:
      Math.round(
        (weekWorkouts
          .filter((w) => w.discipline === d)
          .reduce((s, w) => s + w.duration_sec, 0) /
          3600) *
          10
      ) / 10,
    count: weekWorkouts.filter((w) => w.discipline === d).length,
  }));

  const todayPlanned = planBundle.workouts.filter((w) => w.date === today);
  const fromPlan = planBundle.completedActivities.filter(
    (w) => w.date === today
  );
  const fromGarmin = workouts
    .filter((w) => w.date === today)
    .map(toCompletedFromWorkout);
  const todayCompleted = [
    ...fromPlan,
    ...fromGarmin.filter((g) => !fromPlan.some((t) => t.id === g.id)),
  ];

  return {
    today,
    weekStartParam: targetWeek,
    plan: planBundle.plan,
    plannedWorkouts: planBundle.workouts,
    completedActivities: planBundle.completedActivities,
    allPlans: (allPlans ?? []) as TrainingPlanView[],
    readiness: readiness
      ? {
          overall_score: readiness.overall_score,
          swim_score: readiness.swim_score,
          bike_score: readiness.bike_score,
          run_score: readiness.run_score,
          recommendation: readiness.recommendation,
        }
      : null,
    workouts,
    sleepData: sleepData ?? [],
    loadMetrics: loadMetrics.slice(-56),
    volumeByDiscipline,
    weekWorkoutCount: weekWorkouts.length,
    totalWeekHours,
    todayPlanned,
    todayCompleted,
  };
}
