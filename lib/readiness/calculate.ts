import { format, subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReadinessResult {
  date: string;
  overall_score: number;
  swim_score: number;
  bike_score: number;
  run_score: number;
  fatigue_score: number;
  sleep_score: number;
  hrv_score: number;
  recommendation: string;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreFromHrv(today: number | null, avg7: number | null): number {
  if (today == null) return 50;
  if (avg7 == null || avg7 <= 0) return clampScore(today);
  const ratio = today / avg7;
  if (ratio >= 1.05) return 95;
  if (ratio >= 0.95) return 85;
  if (ratio >= 0.85) return 65;
  if (ratio >= 0.75) return 45;
  return 25;
}

function scoreFromSleep(
  hours: number | null,
  quality: number | null
): number {
  let score = 50;
  if (hours != null) {
    if (hours >= 8) score = 95;
    else if (hours >= 7) score = 85;
    else if (hours >= 6) score = 65;
    else if (hours >= 5) score = 45;
    else score = 25;
  }
  if (quality != null) {
    score = Math.round(score * 0.5 + (quality / 5) * 100 * 0.5);
  }
  return clampScore(score);
}

function scoreFromBodyBattery(value: number | null): number {
  if (value == null) return 50;
  return clampScore(value);
}

function scoreFromFatigue(
  recentDurationSec: number,
  priorDurationSec: number
): number {
  const recentHours = recentDurationSec / 3600;
  const priorHours = priorDurationSec / 3600;
  const load = recentHours * 1.2 + priorHours * 0.5;
  if (load <= 1) return 90;
  if (load <= 3) return 75;
  if (load <= 6) return 55;
  if (load <= 10) return 35;
  return 20;
}

function recommendationForScore(score: number): string {
  if (score >= 80) {
    return "Hartes Training ist heute gut möglich — achte auf Qualität.";
  }
  if (score >= 60) {
    return "Moderates Training empfohlen — kein maximales Intervall.";
  }
  if (score >= 40) {
    return "Lockeres Training oder Technik — Regeneration priorisieren.";
  }
  return "Ruhetag empfohlen — Schlaf und Ernährung optimieren.";
}

function disciplineScore(
  overall: number,
  lastDiscipline: string | null,
  target: "swim" | "bike" | "run"
): number {
  if (!lastDiscipline) return overall;
  if (lastDiscipline === target) {
    return clampScore(overall - 12);
  }
  return clampScore(overall + 4);
}

export async function calculateReadinessForUser(
  supabase: SupabaseClient,
  userId: string,
  date = new Date()
): Promise<ReadinessResult> {
  const dateStr = format(date, "yyyy-MM-dd");
  const weekAgo = format(subDays(date, 7), "yyyy-MM-dd");
  const twoDaysAgo = format(subDays(date, 2), "yyyy-MM-dd");

  const { data: healthToday } = await supabase
    .from("daily_health")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();

  const { data: healthWeek } = await supabase
    .from("daily_health")
    .select("hrv_score, date")
    .eq("user_id", userId)
    .gte("date", weekAgo)
    .lte("date", dateStr);

  const hrvValues = (healthWeek ?? [])
    .map((h) => h.hrv_score)
    .filter((v): v is number => v != null);
  const hrvAvg =
    hrvValues.length > 0
      ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
      : null;

  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("discipline, duration_sec, date")
    .eq("user_id", userId)
    .gte("date", twoDaysAgo)
    .lte("date", dateStr)
    .order("date", { ascending: false });

  const recentDuration = (recentWorkouts ?? [])
    .filter((w) => w.date >= format(subDays(date, 1), "yyyy-MM-dd"))
    .reduce((sum, w) => sum + (w.duration_sec ?? 0), 0);

  const priorDuration = (recentWorkouts ?? [])
    .filter((w) => w.date < format(subDays(date, 1), "yyyy-MM-dd"))
    .reduce((sum, w) => sum + (w.duration_sec ?? 0), 0);

  const lastDiscipline = recentWorkouts?.[0]?.discipline ?? null;

  const hrvScore = scoreFromHrv(
    healthToday?.hrv_score ?? null,
    hrvAvg
  );
  const sleepScore = scoreFromSleep(
    healthToday?.sleep_hours ?? null,
    healthToday?.sleep_quality ?? null
  );
  const fatigueScore = scoreFromFatigue(recentDuration, priorDuration);
  const bodyBatteryScore = scoreFromBodyBattery(
    healthToday?.body_battery ?? null
  );

  const overall = clampScore(
    hrvScore * 0.35 +
      sleepScore * 0.3 +
      fatigueScore * 0.2 +
      bodyBatteryScore * 0.15
  );

  const result: ReadinessResult = {
    date: dateStr,
    overall_score: overall,
    swim_score: disciplineScore(overall, lastDiscipline, "swim"),
    bike_score: disciplineScore(overall, lastDiscipline, "bike"),
    run_score: disciplineScore(overall, lastDiscipline, "run"),
    fatigue_score: fatigueScore,
    sleep_score: sleepScore,
    hrv_score: hrvScore,
    recommendation: recommendationForScore(overall),
  };

  await supabase.from("readiness_scores").upsert(
    {
      user_id: userId,
      date: dateStr,
      overall_score: result.overall_score,
      swim_score: result.swim_score,
      bike_score: result.bike_score,
      run_score: result.run_score,
      fatigue_score: result.fatigue_score,
      sleep_score: result.sleep_score,
      hrv_score: result.hrv_score,
      recommendation: result.recommendation,
    },
    { onConflict: "user_id,date" }
  );

  return result;
}
