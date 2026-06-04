"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrainingPlanImport } from "@/components/training/TrainingPlanImport";
import { TrainingPlanWeek } from "@/components/training/TrainingPlanWeek";
import type {
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";
import { Button } from "@/components/ui/button";

interface TrainingPlanBoardProps {
  initialPlan: TrainingPlanView | null;
  initialWorkouts: PlannedWorkoutView[];
}

export function TrainingPlanBoard({
  initialPlan,
  initialWorkouts,
}: TrainingPlanBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");

  const [plan, setPlan] = useState(initialPlan);
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [allPlans, setAllPlans] = useState<TrainingPlanView[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWeek = useCallback(async (weekStart: string) => {
    setLoading(true);
    const res = await fetch(
      `/api/training/plan?week_start=${encodeURIComponent(weekStart)}`
    );
    const data = (await res.json()) as {
      plan: TrainingPlanView | null;
      workouts: PlannedWorkoutView[];
    };
    setPlan(data.plan);
    setWorkouts(data.workouts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetch("/api/training/plan?list=all")
      .then((r) => r.json())
      .then((data: { plans?: TrainingPlanView[] }) => {
        setAllPlans(data.plans ?? []);
      });
  }, [initialPlan, initialWorkouts]);

  useEffect(() => {
    if (weekParam && weekParam !== plan?.week_start) {
      void loadWeek(weekParam);
    }
  }, [weekParam, plan?.week_start, loadWeek]);

  function selectWeek(weekStart: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", weekStart);
    router.push(`/training?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <TrainingPlanImport
        onImported={() => {
          router.refresh();
          void fetch("/api/training/plan?list=all")
            .then((r) => r.json())
            .then((data: { plans?: TrainingPlanView[] }) => {
              setAllPlans(data.plans ?? []);
            });
        }}
      />

      {allPlans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allPlans.map((p, i) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={
                plan?.week_start === p.week_start ? "default" : "outline"
              }
              onClick={() => selectWeek(p.week_start)}
            >
              Wo {i + 1}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Lade Woche…</p>
      ) : (
        <TrainingPlanWeek plan={plan} workouts={workouts} />
      )}
    </div>
  );
}
