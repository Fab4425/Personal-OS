import type { SupabaseClient } from "@supabase/supabase-js";
import { classAverage } from "@/lib/academic/grades";
import type { AcademicSubjectRow } from "@/lib/academic/subjects";
import { effectiveDurationSec } from "@/lib/training/normalize";
import { getWeekEnd } from "@/lib/weekly-review/dates";

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalSwimKm: number;
  totalBikeKm: number;
  totalRunKm: number;
  totalTrainingHours: number;
  workoutCount: number;
  avgReadiness: number | null;
  habitCompletionRate: number | null;
  academicAverage: number | null;
  goalsMet: boolean[];
}

export async function aggregateWeeklyStats(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string
): Promise<WeeklyStats> {
  const weekEnd = getWeekEnd(weekStart);

  const [
    { data: workouts },
    { data: readiness },
    { data: habits },
    { data: habitLogs },
    { data: subjects },
  ] = await Promise.all([
    supabase
      .from("workouts")
      .select("date, discipline, duration_sec, distance_m, raw_data")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase
      .from("readiness_scores")
      .select("overall_score")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase
      .from("habits")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true),
    supabase
      .from("habit_logs")
      .select("completed")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .eq("completed", true),
    supabase
      .from("academic_subjects")
      .select("id, name, sort_order, oral_grade, written_grade")
      .eq("user_id", userId),
  ]);

  let swim = 0;
  let bike = 0;
  let run = 0;
  let totalSec = 0;

  for (const w of workouts ?? []) {
    const sec = effectiveDurationSec(w.duration_sec, w.raw_data);
    totalSec += sec;
    const km = (w.distance_m ?? 0) / 1000;
    if (w.discipline === "swim") swim += km;
    if (w.discipline === "bike") bike += km;
    if (w.discipline === "run") run += km;
  }

  const readinessScores = (readiness ?? [])
    .map((r) => r.overall_score)
    .filter((s): s is number => s != null);
  const avgReadiness =
    readinessScores.length > 0
      ? Math.round(
          readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length
        )
      : null;

  const habitCount = habits?.length ?? 0;
  const daysInWeek = 7;
  const possibleLogs = habitCount * daysInWeek;
  const completedLogs = habitLogs?.length ?? 0;
  const habitCompletionRate =
    possibleLogs > 0
      ? Math.round((completedLogs / possibleLogs) * 100) / 100
      : null;

  const academicRows: AcademicSubjectRow[] = (subjects ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    sort_order: s.sort_order,
    oral_grade: s.oral_grade != null ? Number(s.oral_grade) : null,
    written_grade: s.written_grade != null ? Number(s.written_grade) : null,
  }));
  const academicAverage = classAverage(academicRows);

  const totalTrainingHours =
    Math.round((totalSec / 3600) * 10) / 10;

  const goalsMet = [
    habitCompletionRate != null && habitCompletionRate >= 0.5,
    totalTrainingHours >= 3,
    avgReadiness != null && avgReadiness >= 55,
  ];

  return {
    weekStart,
    weekEnd,
    totalSwimKm: Math.round(swim * 10) / 10,
    totalBikeKm: Math.round(bike * 10) / 10,
    totalRunKm: Math.round(run * 10) / 10,
    totalTrainingHours,
    workoutCount: workouts?.length ?? 0,
    avgReadiness,
    habitCompletionRate,
    academicAverage,
    goalsMet,
  };
}
