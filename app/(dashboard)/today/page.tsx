import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { TodayPlanner } from "@/components/today/TodayPlanner";
import { WeeklyReviewCard } from "@/components/weekly-review/WeeklyReviewCard";
import { getWeekStart } from "@/lib/weekly-review/dates";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = format(new Date(), "yyyy-MM-dd");

  const weekStart = getWeekStart();

  const [{ data: plan }, { data: habits }, { data: logs }, { data: weeklyReview }] =
    await Promise.all([
    supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user!.id)
      .eq("date", today)
      .maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", user!.id).eq("active", true),
    supabase
      .from("habit_logs")
      .select("habit_id, completed")
      .eq("user_id", user!.id)
      .eq("date", today)
      .eq("completed", true),
    supabase
      .from("weekly_reviews")
      .select("*")
      .eq("user_id", user!.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
  ]);

  return (
    <PageShell
      title="Heute"
      description="Top 3 · Habits · Pomodoro"
      userEmail={user?.email}
      moduleName="Tagesstruktur"
    >
      <WeeklyReviewCard review={weeklyReview} />
      <TodayPlanner
        initialGoals={plan?.top_3_goals ?? []}
        initialMood={plan?.mood_score ?? null}
        initialNotes={plan?.notes ?? ""}
        habits={habits ?? []}
        completedHabitIds={(logs ?? []).map((l) => l.habit_id)}
      />
    </PageShell>
  );
}
