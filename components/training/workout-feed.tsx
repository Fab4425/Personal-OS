import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { formatDisciplineLabel } from "@/lib/training/discipline-normalize";

interface WorkoutRow {
  id: string;
  discipline: string;
  source: string;
  date: string;
  duration_sec: number | null;
  distance_m: number | null;
}

export function WorkoutFeed({ workouts }: { workouts: WorkoutRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
        <CardDescription>Garmin · manuell</CardDescription>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Workouts — Garmin unter Einstellungen synchronisieren.
          </p>
        ) : (
          <ul className="space-y-3">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {formatDisciplineLabel(w.discipline)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(w.date), "EEEE, d. MMM", { locale: de })} ·{" "}
                    {w.source}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {w.duration_sec != null && w.duration_sec > 0 && (
                    <p>
                      {w.duration_sec >= 3600
                        ? `${(w.duration_sec / 3600).toFixed(1)} h`
                        : `${Math.round(w.duration_sec / 60)} min`}
                    </p>
                  )}
                  {w.distance_m != null && w.distance_m > 0 && (
                    <p className="text-muted-foreground">
                      {(w.distance_m / 1000).toFixed(1)} km
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1">
                    {w.source}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
