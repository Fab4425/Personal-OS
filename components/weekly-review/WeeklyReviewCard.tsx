"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export interface WeeklyReviewData {
  id: string;
  week_start: string;
  total_swim_km: number | null;
  total_bike_km: number | null;
  total_run_km: number | null;
  total_training_hours: number | null;
  avg_readiness: number | null;
  ai_summary: string | null;
  ai_tips: string | null;
  goals_met: boolean[] | null;
}

interface WeeklyReviewCardProps {
  review: WeeklyReviewData | null;
  compact?: boolean;
}

export function WeeklyReviewCard({ review, compact }: WeeklyReviewCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    await fetch("/api/weekly-review", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  const weekLabel = review?.week_start
    ? format(parseISO(review.week_start), "d. MMM", { locale: de })
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Wochen-Review</CardTitle>
          <CardDescription>
            {weekLabel
              ? `Woche ab ${weekLabel}`
              : "Sonntags automatisch · KI-Zusammenfassung"}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "…" : review ? "Aktualisieren" : "Generieren"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!review ? (
          <p className="text-sm text-muted-foreground">
            Noch kein Review für diese Woche. Nutze „Generieren“ (benötigt{" "}
            <code className="text-xs">GROQ_API_KEY</code>).
          </p>
        ) : (
          <>
            {!compact && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">
                  {review.total_training_hours ?? 0} h Training
                </Badge>
                <Badge variant="outline">
                  🏊 {review.total_swim_km ?? 0} km
                </Badge>
                <Badge variant="outline">
                  🚴 {review.total_bike_km ?? 0} km
                </Badge>
                <Badge variant="outline">
                  🏃 {review.total_run_km ?? 0} km
                </Badge>
                {review.avg_readiness != null && (
                  <Badge variant="outline">
                    Readiness Ø {review.avg_readiness}
                  </Badge>
                )}
              </div>
            )}
            {review.ai_summary ? (
              <div className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap">{review.ai_summary}</p>
                {review.ai_tips && (
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Tipps nächste Woche
                    </p>
                    <p className="whitespace-pre-wrap">{review.ai_tips}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Statistik gespeichert — KI-Text fehlt (Groq nicht konfiguriert
                oder Fehler).
              </p>
            )}
            {review.goals_met && review.goals_met.length > 0 && !compact && (
              <p className="text-xs text-muted-foreground">
                Ziele: Habits{" "}
                {review.goals_met[0] ? "✓" : "○"} · Training{" "}
                {review.goals_met[1] ? "✓" : "○"} · Readiness{" "}
                {review.goals_met[2] ? "✓" : "○"}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
