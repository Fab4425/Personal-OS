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
  CompletedActivityView,
  PlannedWorkoutView,
  TrainingPlanView,
} from "@/lib/training/plan-types";
import { formatDisciplineLabel } from "@/lib/training/discipline-normalize";

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
  brick: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  rest: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
};

function formatDay(date: string, isToday: boolean) {
  const label = format(parseISO(date), "EEE d.M.", { locale: de });
  return isToday ? `${label} · Heute` : label;
}

function formatDuration(sec: number): string {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)} h`;
  return `${Math.round(sec / 60)} min`;
}

export function TrainingPlanWeek({
  plan,
  workouts,
  today,
  completedByDate = {},
}: {
  plan: TrainingPlanView | null;
  workouts: PlannedWorkoutView[];
  today: string;
  completedByDate?: Record<string, CompletedActivityView[]>;
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

  const sortedDates = Array.from(
    new Set([...Array.from(byDate.keys()), ...Object.keys(completedByDate)])
  ).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <CardDescription>
          {format(parseISO(plan.week_start), "d. MMM", { locale: de })} –{" "}
          {format(parseISO(plan.week_end), "d. MMM yyyy", { locale: de })}
          {" · "}
          {Math.round((plannedMin / 60) * 10) / 10} h geplant ·{" "}
          {Math.round(plannedTss)} TSS · {compliance}% erledigt ({completed}/
          {workouts.length})
        </CardDescription>
        {plan.week_notes && (
          <p className="text-sm text-muted-foreground">{plan.week_notes}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDates.map((date) => {
          const isToday = date === today;
          const doneToday = completedByDate[date] ?? [];
          const plannedToday = byDate.get(date) ?? [];

          return (
            <div
              key={date}
              className={`space-y-2 rounded-xl p-2 ${
                isToday
                  ? "border-2 border-primary bg-primary/5 shadow-sm"
                  : "border border-transparent"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase ${
                  isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {formatDay(date, isToday)}
              </p>

              {doneToday.length > 0 && (
                <ul className="space-y-1.5">
                  {doneToday.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-emerald-800 dark:text-emerald-300">
                        ✓{" "}
                        {a.name?.trim() ||
                          formatDisciplineLabel(a.discipline)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDuration(a.duration_sec)}
                        {a.distance_m != null &&
                          a.distance_m > 0 &&
                          ` · ${(a.distance_m / 1000).toFixed(1)} km`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <ul className="space-y-2">
                {plannedToday.length === 0 && doneToday.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    Keine Einheit geplant
                  </li>
                )}
                {plannedToday.map((w) => (
                  <li
                    key={w.id}
                    className={`rounded-lg border p-3 text-sm ${
                      isToday
                        ? "border-primary/30 bg-background"
                        : "border-border/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${DISCIPLINE_COLOR[w.discipline] ?? ""}`}
                      >
                        {formatDisciplineLabel(w.discipline)}
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
                      <p className="mt-1 text-muted-foreground">
                        {w.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {w.duration_min != null && `${w.duration_min} min`}
                      {w.distance_m != null &&
                        ` · ${(w.distance_m / 1000).toFixed(1)} km`}
                      {w.target_tss != null && ` · ${w.target_tss} TSS`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
