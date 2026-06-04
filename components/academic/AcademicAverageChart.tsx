"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import type { GradeHistoryPoint } from "@/lib/academic/subjects";
export function AcademicAverageChart({ data }: { data: GradeHistoryPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d. MMM", { locale: de }),
    average: Number(d.average_grade),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schnitt-Verlauf</CardTitle>
        <CardDescription>
          Notendurchschnitt über die Zeit (Skala 1–6, niedriger ist besser)
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {chartData.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Trage Noten ein — der Verlauf erscheint ab dem zweiten
            gespeicherten Tag.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[1, 6]}
                reversed
                tick={{ fontSize: 11 }}
                allowDecimals
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Schnitt"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
