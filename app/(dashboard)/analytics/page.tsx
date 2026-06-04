import { format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { TrainingHeatmap } from "@/components/analytics/TrainingHeatmap";
import { TriVolumeChart } from "@/components/analytics/TriVolumeChart";
import { classAverage, formatGrade } from "@/lib/academic/grades";
import type { AcademicSubjectRow } from "@/lib/academic/subjects";
import { effectiveDurationSec } from "@/lib/training/normalize";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const yearStart = format(subDays(new Date(), 365), "yyyy-MM-dd");

  const [{ data: workouts }, { data: subjects }] = await Promise.all([
    supabase
      .from("workouts")
      .select("date, duration_sec, discipline, distance_m, raw_data")
      .eq("user_id", user!.id)
      .gte("date", yearStart),
    supabase
      .from("academic_subjects")
      .select("id, name, sort_order, oral_grade, written_grade")
      .eq("user_id", user!.id),
  ]);

  const volumeByDay = new Map<string, number>();
  const triTotals = { swim: 0, bike: 0, run: 0 };

  for (const w of workouts ?? []) {
    const date = String(w.date).slice(0, 10);
    const mins = Math.round(
      effectiveDurationSec(w.duration_sec, w.raw_data) / 60
    );
    volumeByDay.set(date, (volumeByDay.get(date) ?? 0) + mins);
    const km = (w.distance_m ?? 0) / 1000;
    if (w.discipline === "swim") triTotals.swim += km;
    if (w.discipline === "bike") triTotals.bike += km;
    if (w.discipline === "run") triTotals.run += km;
  }

  const heatmapDays = Array.from(volumeByDay.entries()).map(
    ([date, minutes]) => ({ date, minutes })
  );

  const triChart = [
    { name: "Swim", km: Math.round(triTotals.swim * 10) / 10 },
    { name: "Bike", km: Math.round(triTotals.bike * 10) / 10 },
    { name: "Run", km: Math.round(triTotals.run * 10) / 10 },
  ];

  const academicRows: AcademicSubjectRow[] = (subjects ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    sort_order: s.sort_order,
    oral_grade: s.oral_grade != null ? Number(s.oral_grade) : null,
    written_grade: s.written_grade != null ? Number(s.written_grade) : null,
  }));
  const academicAvg = classAverage(academicRows);

  return (
    <PageShell
      title="Analytics"
      description="Volumen · Triathlon · Akademie"
      userEmail={user?.email}
      moduleName="Analytics"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TrainingHeatmap days={heatmapDays} />
        <TriVolumeChart data={triChart} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notendurchschnitt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {academicAvg != null ? formatGrade(academicAvg) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Deutsche Skala 1–6 (niedriger ist besser)
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
