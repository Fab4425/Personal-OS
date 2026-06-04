import type { SupabaseClient } from "@supabase/supabase-js";
import { format, startOfWeek } from "date-fns";
import { syncPlannedWorkoutStatus } from "@/lib/training/plan-match";
import type {
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";

export async function getCurrentTrainingPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plan: TrainingPlanView | null; workouts: PlannedWorkoutView[] }> {
  const currentWeekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );

  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, name, week_start, week_end, week_notes")
    .eq("user_id", userId)
    .eq("week_start", currentWeekStart)
    .maybeSingle();

  if (!plan) {
    const { data: latest } = await supabase
      .from("training_plans")
      .select("id, name, week_start, week_end, week_notes")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) {
      return { plan: null, workouts: [] };
    }

    await syncPlannedWorkoutStatus(supabase, userId, latest.id);

    const { data: workouts } = await supabase
      .from("planned_workouts")
      .select("*")
      .eq("plan_id", latest.id)
      .order("date")
      .order("sort_order");

    return {
      plan: latest as TrainingPlanView,
      workouts: (workouts ?? []) as PlannedWorkoutView[],
    };
  }

  await syncPlannedWorkoutStatus(supabase, userId, plan.id);

  const { data: workouts } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", plan.id)
    .order("date")
    .order("sort_order");

  return {
    plan: plan as TrainingPlanView,
    workouts: (workouts ?? []) as PlannedWorkoutView[],
  };
}
