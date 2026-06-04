"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns";

interface DayVolume {
  date: string;
  minutes: number;
}

export function TrainingHeatmap({ days }: { days: DayVolume[] }) {
  const end = new Date();
  const start = subDays(end, 84);
  const interval = eachDayOfInterval({ start, end });
  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const max = Math.max(...days.map((d) => d.minutes), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trainings-Heatmap</CardTitle>
        <CardDescription>Letzte 12 Wochen (Minuten)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {interval.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const minutes = byDate.get(key) ?? 0;
            const intensity = minutes / max;
            return (
              <div
                key={key}
                title={`${format(parseISO(key), "dd.MM.")}: ${minutes} min`}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  minutes === 0
                    ? "bg-muted"
                    : intensity > 0.66
                      ? "bg-primary"
                      : intensity > 0.33
                        ? "bg-primary/60"
                        : "bg-primary/30"
                )}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
