import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregateWeeklyStats } from "@/lib/weekly-review/aggregate";
import { getWeekStart } from "@/lib/weekly-review/dates";
import { generateWeeklyReviewAi } from "@/lib/weekly-review/generate";
import { notifyWeeklyReviewReady } from "@/lib/push/notify";

export interface WeeklyReviewResult {
  weekStart: string;
  skipped?: boolean;
  error?: string;
}

export async function runWeeklyReviewForUser(
  supabase: SupabaseClient,
  userId: string,
  options?: { weekStart?: string; userName?: string; skipAi?: boolean }
): Promise<WeeklyReviewResult> {
  const weekStart = options?.weekStart ?? getWeekStart();

  const stats = await aggregateWeeklyStats(supabase, userId, weekStart);

  let aiSummary: string | null = null;
  let aiTips: string | null = null;

  if (!options?.skipAi && process.env.GROQ_API_KEY) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .maybeSingle();

      const userName =
        options?.userName ?? profile?.name ?? "Athlet";

      const ai = await generateWeeklyReviewAi(stats, userName);
      aiSummary = ai.summary;
      aiTips = ai.tips;
    } catch {
      aiSummary = null;
      aiTips = null;
    }
  }

  const { error } = await supabase.from("weekly_reviews").upsert(
    {
      user_id: userId,
      week_start: weekStart,
      total_swim_km: stats.totalSwimKm,
      total_bike_km: stats.totalBikeKm,
      total_run_km: stats.totalRunKm,
      total_training_hours: stats.totalTrainingHours,
      avg_readiness: stats.avgReadiness,
      ai_summary: aiSummary,
      ai_tips: aiTips,
      goals_met: stats.goalsMet,
    },
    { onConflict: "user_id,week_start" }
  );

  if (error) {
    return { weekStart, error: error.message };
  }

  if (aiSummary) {
    await notifyWeeklyReviewReady(supabase, userId, weekStart);
  }

  return { weekStart };
}
