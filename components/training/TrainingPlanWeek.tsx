"use client";

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";

export type { PlannedWorkoutView, TrainingPlanView };

const STATUS_LABEL: Record<string, string> = {
  planned: "Geplant",
  completed: "Erledigt",
  partial: "Teilweise",
  skipped: "Ausgelassen",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "success" | "warning" | "danger"
> = {
  planned: "outline",
  completed: "success",
  partial: "warning",
  skipped: "danger",
};

const DISCIPLINE_COLOR: Record<string, string> = {
  swim: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  bike: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  run: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  gym: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  race: "bg-red-500/15 text-red-700 dark:text-red-300",
};

function formatDay(date: string) {
  return format(parseISO(date), "EEE d.M.", { locale: de });
}

export function TrainingPlanWeek({
  plan,
  workouts,
}: {
  plan: TrainingPlanView | null;
  workouts: PlannedWorkoutView[];
}) {
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wochenplan</CardTitle>
          <CardDescription>
            Noch kein Plan — lade eine JSON-Datei hoch (von Claude oder manuell).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const plannedTss = workouts.reduce((s, w) => s + (w.target_tss ?? 0), 0);
  const plannedMin = workouts.reduce((s, w) => s + (w.duration_min ?? 0), 0);
  const completed = workouts.filter((w) => w.status === "completed").length;
  const compliance =
    workouts.length > 0
      ? Math.round((completed / workouts.length) * 100)
      : 0;

  const byDate = new Map<string, PlannedWorkoutView[]>();
  for (const w of workouts) {
    const list = byDate.get(w.date) ?? [];
    list.push(w);
    byDate.set(w.date, list);
  }
  const sortedDates = Array.from(byDate.keys()).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <CardDescription>
          {format(parseISO(plan.week_start), "d. MMM", { locale: de })} –{" "}
          {format(parseISO(plan.week_end), "d. MMM yyyy", { locale: de })}
          {" · "}
          {Math.round(plannedMin / 60 * 10) / 10} h geplant · {Math.round(plannedTss)}{" "}
          TSS · {compliance}% erledigt ({completed}/{workouts.length})
        </CardDescription>
        {plan.week_notes && (
          <p className="text-sm text-muted-foreground">{plan.week_notes}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDates.map((date) => (
          <div key={date} className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {formatDay(date)}
            </p>
            <ul className="space-y-2">
              {(byDate.get(date) ?? []).map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border border-border/80 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${DISCIPLINE_COLOR[w.discipline] ?? ""}`}
                    >
                      {w.discipline}
                    </span>
                    <span className="font-medium">{w.title}</span>
                    <Badge variant={STATUS_VARIANT[w.status] ?? "outline"}>
                      {STATUS_LABEL[w.status] ?? w.status}
                    </Badge>
                    {w.intensity && (
                      <span className="text-xs text-muted-foreground">
                        {w.intensity}
                      </span>
                    )}
                  </div>
                  {w.description && (
                    <p className="mt-1 text-muted-foreground">{w.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {w.duration_min != null && `${w.duration_min} min`}
                    {w.distance_m != null &&
                      ` · ${(w.distance_m / 1000).toFixed(1)} km`}
                    {w.target_tss != null && ` · ${w.target_tss} TSS`}
                  </p>
                  {Array.isArray(w.structure) && w.structure.length > 0 && (
                    <ul className="mt-2 space-y-0.5 border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">
                      {(w.structure as { type?: string; duration_min?: number; zone?: string; notes?: string }[]).map(
                        (step, i) => (
                          <li key={i}>
                            {step.type}
                            {step.duration_min != null && ` ${step.duration_min}′`}
                            {step.zone && ` · ${step.zone}`}
                            {step.notes && ` — ${step.notes}`}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
