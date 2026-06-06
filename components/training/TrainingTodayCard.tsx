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
import { formatDisciplineLabel } from "@/lib/training/discipline-normalize";
import type {
  CompletedActivityView,
  PlannedWorkoutView,
} from "@/lib/training/plan-types";

const STATUS_LABEL: Record<string, string> = {
  planned: "Geplant",
  completed: "Erledigt",
  partial: "Teilweise",
  skipped: "Ausgelassen",
};

function formatDuration(sec: number): string {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)} h`;
  return `${Math.round(sec / 60)} min`;
}

export function TrainingTodayCard({
  today,
  planned,
  completed,
}: {
  today: string;
  planned: PlannedWorkoutView[];
  completed: CompletedActivityView[];
}) {
  const dateLabel = format(parseISO(today), "EEEE, d. MMMM", { locale: de });

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Heute</CardTitle>
        <CardDescription>{dateLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Geplant
          </p>
          {planned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Einheit im Plan für heute.
            </p>
          ) : (
            <ul className="space-y-2">
              {planned.map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border border-border/80 bg-background p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{w.title}</span>
                    <Badge variant="outline">
                      {formatDisciplineLabel(w.discipline)}
                    </Badge>
                    <Badge
                      variant={
                        w.status === "completed"
                          ? "success"
                          : w.status === "partial"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {STATUS_LABEL[w.status] ?? w.status}
                    </Badge>
                  </div>
                  {w.duration_min != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {w.duration_min} min geplant
                      {w.target_tss != null && ` · ${w.target_tss} TSS`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Gemacht
          </p>
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Aktivität synchronisiert — Garmin-Sync oben.
            </p>
          ) : (
            <ul className="space-y-2">
              {completed.map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {w.name?.trim() ||
                        formatDisciplineLabel(w.discipline)}
                    </span>
                    <Badge variant="outline">
                      {formatDisciplineLabel(w.discipline)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {w.source}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDuration(w.duration_sec)}
                    {w.distance_m != null &&
                      w.distance_m > 0 &&
                      ` · ${(w.distance_m / 1000).toFixed(1)} km`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
