import { format, subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSystemPrompt, type CoachContext } from "@/lib/ai/system-prompt";
import { computeLoadMetrics, getLatestMetrics } from "@/lib/training/load-metrics";

export async function buildCoachContext(
  supabase: SupabaseClient,
  userId: string,
  userName: string
): Promise<string> {
  const today = format(new Date(), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [
    { data: readiness },
    { data: health },
    { data: healthWeek },
    { data: lastWorkout },
    { data: workouts },
    { data: projects },
    { data: dailyPlan },
  ] = await Promise.all([
    supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("daily_health")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("daily_health")
      .select("hrv_score")
      .eq("user_id", userId)
      .gte("date", weekAgo),
    supabase
      .from("workouts")
      .select("discipline, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("date, tss, duration_sec, discipline")
      .eq("user_id", userId)
      .gte("date", weekAgo),
    supabase
      .from("dev_projects")
      .select("name, status, progress_percent")
      .eq("user_id", userId)
      .in("status", ["active", "idea"]),
    supabase
      .from("daily_plans")
      .select("top_3_goals, notes")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
  ]);

  const hrvValues = (healthWeek ?? [])
    .map((h) => h.hrv_score)
    .filter((v): v is number => v != null);
  const hrvAvg =
    hrvValues.length > 0
      ? Math.round(
          hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
        )
      : 0;

  const loadPoints = computeLoadMetrics(workouts ?? [], 90);
  const latest = getLatestMetrics(loadPoints);

  const projectSummary =
    (projects ?? []).length > 0
      ? (projects ?? [])
          .map(
            (p) =>
              `${p.name} (${p.status}, ${p.progress_percent ?? 0}%)`
          )
          .join("; ")
      : "keine aktiven Projekte";

  const todayPlan =
    dailyPlan?.top_3_goals?.length
      ? dailyPlan.top_3_goals.join(", ")
      : dailyPlan?.notes ?? "nichts geplant";

  const ctx: CoachContext = {
    userName,
    readiness: readiness?.overall_score ?? 0,
    sleepHours: health?.sleep_hours ?? 0,
    sleepQuality: health?.sleep_quality ?? 0,
    hrv: health?.hrv_score ?? 0,
    hrvAvg,
    lastWorkoutDiscipline: lastWorkout?.discipline ?? "—",
    lastWorkoutDate: lastWorkout?.date ?? "—",
    atl: latest.atl,
    tsb: latest.tsb,
    projects: projectSummary,
    todayPlan,
  };

  return buildSystemPrompt(ctx);
}
