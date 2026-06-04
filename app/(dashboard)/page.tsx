import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WeeklyReviewCard } from "@/components/weekly-review/WeeklyReviewCard";
import { getWeekStart } from "@/lib/weekly-review/dates";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = format(new Date(), "yyyy-MM-dd");

  const weekStart = getWeekStart();

  const [{ data: readiness }, { data: todayWorkouts }, { data: health }, { data: weeklyReview }] =
    await Promise.all([
      supabase
        .from("readiness_scores")
        .select("overall_score, recommendation")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("workouts")
        .select("id, discipline, duration_sec")
        .eq("user_id", user!.id)
        .eq("date", today),
      supabase
        .from("daily_health")
        .select("sleep_hours, sleep_quality, body_battery, hrv_score")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", user!.id)
        .eq("week_start", weekStart)
        .maybeSingle(),
    ]);

  return (
    <PageShell
      title="Übersicht"
      description="Dein persönliches Dashboard"
      userEmail={user?.email}
      moduleName="Home"
    >
      <WeeklyReviewCard review={weeklyReview} compact />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Readiness</CardTitle>
            <CardDescription>Heute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold tabular-nums">
              {readiness?.overall_score ?? "—"}
            </p>
            {readiness?.recommendation && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {readiness.recommendation}
              </p>
            )}
            {!readiness && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings">Sync & berechnen</Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training heute</CardTitle>
            <CardDescription>
              {(todayWorkouts ?? []).length} Einheit(en)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(todayWorkouts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Einheiten — Garmin sync in Einstellungen
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(todayWorkouts ?? []).map((w) => (
                  <li key={w.id}>
                    <Badge variant="outline" className="mr-2">
                      {w.discipline}
                    </Badge>
                    {w.duration_sec
                      ? `${Math.round(w.duration_sec / 60)} min`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schlaf & Recovery</CardTitle>
            <CardDescription>Garmin Gesundheit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Schlaf:{" "}
              {health?.sleep_hours != null
                ? `${health.sleep_hours} h`
                : "—"}
              {health?.sleep_quality != null &&
                ` · Qualität ${health.sleep_quality}/5`}
            </p>
            <p>HRV: {health?.hrv_score ?? "—"}</p>
            <p>Body Battery: {health?.body_battery ?? "—"}</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
