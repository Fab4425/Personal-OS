"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { TrainingPlanImport } from "@/components/training/TrainingPlanImport";
import { TrainingPlanWeek } from "@/components/training/TrainingPlanWeek";
import type {
  CompletedActivityView,
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";
import { groupCompletedByDate } from "@/lib/training/plan-utils";
import { Button } from "@/components/ui/button";

interface TrainingPlanBoardProps {
  plan: TrainingPlanView | null;
  workouts: PlannedWorkoutView[];
  completedActivities: CompletedActivityView[];
  allPlans: TrainingPlanView[];
  loading?: boolean;
  onRevalidate: () => void;
}

export function TrainingPlanBoard({
  plan,
  workouts,
  completedActivities,
  allPlans,
  loading = false,
  onRevalidate,
}: TrainingPlanBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = format(new Date(), "yyyy-MM-dd");

  const completedByDate = useMemo(
    () => groupCompletedByDate(completedActivities),
    [completedActivities]
  );

  function selectWeek(weekStart: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", weekStart);
    router.push(`/training?${params.toString()}`);
  }

  function weekContainsToday(p: TrainingPlanView) {
    return p.week_start <= today && p.week_end >= today;
  }

  return (
    <div className="space-y-4">
      <TrainingPlanImport
        onImported={() => {
          onRevalidate();
        }}
      />

      {allPlans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allPlans.map((p, i) => {
            const isSelected = plan?.week_start === p.week_start;
            const isCurrentWeek = weekContainsToday(p);

            return (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className={
                  isCurrentWeek && !isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : isCurrentWeek
                      ? "ring-2 ring-primary/60 ring-offset-2"
                      : undefined
                }
                onClick={() => selectWeek(p.week_start)}
              >
                Wo {i + 1}
                {isCurrentWeek ? " · heute" : ""}
              </Button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Lade Woche…</p>
      ) : (
        <TrainingPlanWeek
          plan={plan}
          workouts={workouts}
          today={today}
          completedByDate={completedByDate}
        />
      )}
    </div>
  );
}
