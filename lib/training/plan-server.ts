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

  let activePlan = plan;

  if (!activePlan) {
    const { data: latest } = await supabase
      .from("training_plans")
      .select("id, name, week_start, week_end, week_notes")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    activePlan = latest;
  }

  if (!activePlan) {
    return { plan: null, workouts: [] };
  }

  await syncPlannedWorkoutStatus(supabase, userId, activePlan.id);

  const { data: workouts } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", activePlan.id)
    .order("date")
    .order("sort_order");

  return {
    plan: activePlan as TrainingPlanView,
    workouts: (workouts ?? []) as PlannedWorkoutView[],
  };
}
