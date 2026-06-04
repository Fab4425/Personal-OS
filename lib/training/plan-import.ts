import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseTrainingPlanJson,
  weekEndFromStart,
  type TrainingPlanJson,
} from "@/lib/training/plan-schema";
import { syncPlannedWorkoutStatus } from "@/lib/training/plan-match";

export interface PlanImportResult {
  planId: string;
  planName: string;
  weekStart: string;
  workoutsImported: number;
}

export async function importTrainingPlanJson(
  supabase: SupabaseClient,
  userId: string,
  json: unknown,
  sourceFilename?: string
): Promise<PlanImportResult> {
  const { plan, workouts } = parseTrainingPlanJson(json);
  const weekEnd = weekEndFromStart(plan.week_start);

  const { data: existing } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", plan.week_start)
    .maybeSingle();

  if (existing) {
    await supabase.from("training_plans").delete().eq("id", existing.id);
  }

  const { data: insertedPlan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      user_id: userId,
      name: plan.plan_name,
      week_start: plan.week_start,
      week_end: weekEnd,
      week_notes: plan.week_notes ?? null,
      source_filename: sourceFilename ?? null,
      raw_json: json as TrainingPlanJson,
    })
    .select("id")
    .single();

  if (planError || !insertedPlan) {
    throw new Error(planError?.message ?? "Plan konnte nicht gespeichert werden");
  }

  const rows = workouts.map((w, index) => ({
    plan_id: insertedPlan.id,
    user_id: userId,
    date: w.date,
    discipline: w.discipline,
    title: w.title,
    description: w.description,
    duration_min: w.duration_min,
    distance_m: w.distance_m,
    target_tss: w.target_tss,
    intensity: w.intensity,
    structure: w.structure,
    sort_order: index,
    status: "planned" as const,
  }));

  const { error: workoutsError } = await supabase
    .from("planned_workouts")
    .insert(rows);

  if (workoutsError) {
    await supabase.from("training_plans").delete().eq("id", insertedPlan.id);
    throw new Error(workoutsError.message);
  }

  await syncPlannedWorkoutStatus(supabase, userId, insertedPlan.id);

  return {
    planId: insertedPlan.id,
    planName: plan.plan_name,
    weekStart: plan.week_start,
    workoutsImported: rows.length,
  };
}
