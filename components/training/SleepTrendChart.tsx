"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SleepPoint {
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  hrv_score: number | null;
}

export function SleepTrendChart({ data }: { data: SleepPoint[] }) {
  const chartData = data.map((d) => ({
    label: format(parseISO(d.date), "d. MMM", { locale: de }),
    sleep: d.sleep_hours ?? 0,
    quality: d.sleep_quality ?? 0,
    hrv: d.hrv_score ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schlaf & HRV</CardTitle>
        <CardDescription>Letzte 30 Tage (Garmin)</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Schlafdaten.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="sleep"
                name="Schlaf (h)"
                stroke="hsl(239 84% 67%)"
                fill="hsl(239 84% 67% / 0.2)"
              />
              <Area
                type="monotone"
                dataKey="hrv"
                name="HRV"
                stroke="hsl(160 60% 45%)"
                fill="hsl(160 60% 45% / 0.15)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
