"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LoadMetricsPoint } from "@/lib/training/load-metrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface ATLCTLChartProps {
  data: LoadMetricsPoint[];
  hasLoad?: boolean;
  workoutCount?: number;
}

export function ATLCTLChart({
  data,
  hasLoad = false,
  workoutCount = 0,
}: ATLCTLChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d. MMM", { locale: de }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ATL · CTL · Form (TSB)</CardTitle>
        <CardDescription>
          Letzte 8 Wochen · geschätztes TSS aus Dauer
          {workoutCount > 0 ? ` · ${workoutCount} Workouts geladen` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length < 2 || !hasLoad ? (
          <p className="text-sm text-muted-foreground">
            {workoutCount === 0
              ? "Keine Workouts in der DB — unter Einstellungen Garmin syncen."
              : "Workouts ohne Dauer/TSS — bitte Garmin erneut synchronisieren (Dauer wird neu berechnet)."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="atl"
                name="ATL"
                stroke="hsl(0 84% 60%)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="ctl"
                name="CTL"
                stroke="hsl(239 84% 67%)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="tsb"
                name="TSB"
                stroke="hsl(160 60% 45%)"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
