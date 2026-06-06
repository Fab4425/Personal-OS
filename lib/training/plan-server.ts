import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { syncPlannedWorkoutStatus } from "@/lib/training/plan-match";
import type {
  CompletedActivityView,
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";
import {
  effectiveDurationSec,
  normalizeWorkoutDate,
} from "@/lib/training/normalize";

export { groupCompletedByDate } from "@/lib/training/plan-utils";

export async function findPlanContainingDate(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<TrainingPlanView | null> {
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, name, week_start, week_end, week_notes")
    .eq("user_id", userId)
    .lte("week_start", dateStr)
    .gte("week_end", dateStr)
    .maybeSingle();

  return (plan as TrainingPlanView | null) ?? null;
}

export async function findBestPlanForDate(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<TrainingPlanView | null> {
  const containing = await findPlanContainingDate(supabase, userId, dateStr);
  if (containing) return containing;

  const { data: past } = await supabase
    .from("training_plans")
    .select("id, name, week_start, week_end, week_notes")
    .eq("user_id", userId)
    .lte("week_start", dateStr)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (past) return past as TrainingPlanView;

  const { data: future } = await supabase
    .from("training_plans")
    .select("id, name, week_start, week_end, week_notes")
    .eq("user_id", userId)
    .gte("week_start", dateStr)
    .order("week_start", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (future as TrainingPlanView | null) ?? null;
}

export async function fetchCompletedActivitiesForRange(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<CompletedActivityView[]> {
  const { data } = await supabase
    .from("workouts")
    .select("id, date, discipline, source, duration_sec, distance_m, raw_data")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date")
    .order("created_at", { ascending: true });

  return (data ?? []).map((w) => ({
    id: w.id,
    date: normalizeWorkoutDate(String(w.date)),
    discipline: w.discipline,
    source: w.source,
    duration_sec: effectiveDurationSec(w.duration_sec, w.raw_data),
    distance_m: w.distance_m,
    name:
      w.raw_data &&
      typeof w.raw_data === "object" &&
      "activityName" in (w.raw_data as object)
        ? String((w.raw_data as { activityName?: string }).activityName ?? "")
        : null,
  }));
}

export async function getTrainingPlanByWeekStart(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string
): Promise<{
  plan: TrainingPlanView | null;
  workouts: PlannedWorkoutView[];
  completedActivities: CompletedActivityView[];
}> {
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, name, week_start, week_end, week_notes")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!plan) {
    return { plan: null, workouts: [], completedActivities: [] };
  }

  await syncPlannedWorkoutStatus(supabase, userId, plan.id);

  const { data: workouts } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", plan.id)
    .order("date")
    .order("sort_order");

  const completedActivities = await fetchCompletedActivitiesForRange(
    supabase,
    userId,
    plan.week_start,
    plan.week_end
  );

  return {
    plan: plan as TrainingPlanView,
    workouts: (workouts ?? []) as PlannedWorkoutView[],
    completedActivities,
  };
}

export async function getCurrentTrainingPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  plan: TrainingPlanView | null;
  workouts: PlannedWorkoutView[];
  completedActivities: CompletedActivityView[];
}> {
  const today = format(new Date(), "yyyy-MM-dd");
  const activePlan = await findBestPlanForDate(supabase, userId, today);

  if (!activePlan) {
    return { plan: null, workouts: [], completedActivities: [] };
  }

  return getTrainingPlanByWeekStart(
    supabase,
    userId,
    activePlan.week_start
  );
}
