import Link from "next/link";
import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { ATLCTLChart } from "@/components/training/ATLCTLChart";
import { DisciplineTabs } from "@/components/training/DisciplineTabs";
import { ReadinessAmpel } from "@/components/training/ReadinessAmpel";
import { SleepTrendChart } from "@/components/training/SleepTrendChart";
import { TrainingPlanImport } from "@/components/training/TrainingPlanImport";
import { TrainingPlanWeek } from "@/components/training/TrainingPlanWeek";
import { getCurrentTrainingPlan } from "@/lib/training/plan-server";
import { computeLoadMetrics } from "@/lib/training/load-metrics";
import {
  effectiveDurationSec,
  normalizeWorkoutDate,
} from "@/lib/training/normalize";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const ninetyAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");

  const [
    { data: readiness },
    { data: workoutsRaw },
    { data: sleepData },
    trainingPlan,
  ] = await Promise.all([
    supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", user!.id)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select(
        "id, discipline, source, date, duration_sec, distance_m, tss, raw_data"
      )
      .eq("user_id", user!.id)
      .gte("date", ninetyAgo)
      .order("date", { ascending: false }),
    supabase
      .from("daily_health")
      .select("date, sleep_hours, sleep_quality, hrv_score")
      .eq("user_id", user!.id)
      .gte("date", thirtyAgo)
      .order("date", { ascending: true }),
    getCurrentTrainingPlan(supabase, user!.id),
  ]);

  const workouts = (workoutsRaw ?? []).map((w) => ({
    ...w,
    date: normalizeWorkoutDate(String(w.date)),
    duration_sec: effectiveDurationSec(w.duration_sec, w.raw_data),
  }));

  const loadMetrics = computeLoadMetrics(
    workouts.map((w) => ({
      date: w.date,
      tss: w.tss != null ? Number(w.tss) : null,
      duration_sec: w.duration_sec,
      discipline: w.discipline,
      raw_data: w.raw_data,
    }))
  );

  const weekStart = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const weekWorkouts = workouts.filter((w) => w.date >= weekStart);
  const totalWeekHours =
    Math.round(
      (weekWorkouts.reduce((s, w) => s + (w.duration_sec ?? 0), 0) / 3600) *
        10
    ) / 10;

  const volumeByDiscipline = ["swim", "bike", "run", "gym"].map((d) => ({
    discipline: d,
    hours:
      Math.round(
        (weekWorkouts
          .filter((w) => w.discipline === d)
          .reduce((s, w) => s + (w.duration_sec ?? 0), 0) /
          3600) *
          10
      ) / 10,
    count: weekWorkouts.filter((w) => w.discipline === d).length,
  }));

  const chartData = loadMetrics.slice(-56);
  const hasLoad = chartData.some((p) => p.tss > 0);

  return (
    <PageShell
      title="Training"
      description="Belastung · Readiness · Schlaf"
      userEmail={user?.email}
      moduleName="Training"
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href="/settings">Sync Garmin</Link>
        </Button>
      </div>

      <TrainingPlanImport />
      <TrainingPlanWeek
        plan={trainingPlan.plan}
        workouts={trainingPlan.workouts}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadinessAmpel
          overall={readiness?.overall_score ?? null}
          swim={readiness?.swim_score ?? null}
          bike={readiness?.bike_score ?? null}
          run={readiness?.run_score ?? null}
          recommendation={readiness?.recommendation ?? null}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Woche (7 Tage)</CardTitle>
            <CardDescription>
              {weekWorkouts.length} Einheiten · {totalWeekHours} h gesamt
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {volumeByDiscipline.map((v) => (
              <div key={v.discipline} className="rounded-lg border p-3">
                <p className="font-medium capitalize">{v.discipline}</p>
                <p className="text-muted-foreground">
                  {v.hours} h · {v.count} Einheiten
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ATLCTLChart data={chartData} hasLoad={hasLoad} workoutCount={workouts.length} />
      <SleepTrendChart data={sleepData ?? []} />
      <DisciplineTabs workouts={workouts} />
    </PageShell>
  );
}
