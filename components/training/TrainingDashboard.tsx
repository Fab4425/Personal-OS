"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ATLCTLChart } from "@/components/training/ATLCTLChart";
import { DisciplineTabs } from "@/components/training/DisciplineTabs";
import { ReadinessAmpel } from "@/components/training/ReadinessAmpel";
import { SleepTrendChart } from "@/components/training/SleepTrendChart";
import { TrainingPlanBoard } from "@/components/training/TrainingPlanBoard";
import { TrainingDashboardSkeleton } from "@/components/training/TrainingDashboardSkeleton";
import { TrainingSyncButton } from "@/components/training/TrainingSyncButton";
import { TrainingTodayCard } from "@/components/training/TrainingTodayCard";
import type { TrainingDashboardData } from "@/lib/training/dashboard";
import {
  jsonFetcher,
  revalidateTraining,
  trainingDashboardKey,
} from "@/lib/swr/training";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TrainingDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, error, isLoading, isValidating } = useSWR<TrainingDashboardData>(
    trainingDashboardKey(weekParam),
    jsonFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 3_000,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (!data?.allPlans.length || weekParam) return;

    const planForToday = data.allPlans.find(
      (p) => p.week_start <= today && p.week_end >= today
    );
    const targetWeek =
      planForToday?.week_start ?? data.weekStartParam ?? data.allPlans[0]?.week_start;

    if (targetWeek) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("week", targetWeek);
      router.replace(`/training?${params.toString()}`);
    }
  }, [data, router, searchParams, today, weekParam]);

  useEffect(() => {
    function onSynced() {
      void revalidateTraining(weekParam);
    }
    window.addEventListener("personal-os:garmin-synced", onSynced);
    return () =>
      window.removeEventListener("personal-os:garmin-synced", onSynced);
  }, [weekParam]);

  const chartData = data?.loadMetrics ?? [];
  const hasLoad = chartData.some((p) => p.tss > 0);
  const isRefreshing = isValidating && !isLoading;

  const planBoardProps = useMemo(
    () => ({
      plan: data?.plan ?? null,
      workouts: data?.plannedWorkouts ?? [],
      completedActivities: data?.completedActivities ?? [],
      allPlans: data?.allPlans ?? [],
      loading: isValidating && !data,
      onRevalidate: () => revalidateTraining(weekParam),
    }),
    [data, isValidating, weekParam]
  );

  if (isLoading && !data) {
    return <TrainingDashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <p className="text-sm text-destructive">
        {error.message ?? "Training konnte nicht geladen werden."}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TrainingSyncButton />
        {isRefreshing && (
          <span className="text-xs text-muted-foreground">Aktualisiere…</span>
        )}
      </div>

      <TrainingTodayCard
        today={data.today}
        planned={data.todayPlanned}
        completed={data.todayCompleted}
      />

      <TrainingPlanBoard {...planBoardProps} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadinessAmpel
          overall={data.readiness?.overall_score ?? null}
          swim={data.readiness?.swim_score ?? null}
          bike={data.readiness?.bike_score ?? null}
          run={data.readiness?.run_score ?? null}
          recommendation={data.readiness?.recommendation ?? null}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Woche (7 Tage)</CardTitle>
            <CardDescription>
              {data.weekWorkoutCount} Einheiten · {data.totalWeekHours} h gesamt
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {data.volumeByDiscipline.map((v) => (
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

      <ATLCTLChart
        data={chartData}
        hasLoad={hasLoad}
        workoutCount={data.workouts.length}
      />
      <SleepTrendChart data={data.sleepData} />
      <DisciplineTabs workouts={data.workouts} />
    </div>
  );
}
