import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReadinessCardProps {
  score: number | null;
  recommendation: string | null;
  swim: number | null;
  bike: number | null;
  run: number | null;
}

function scoreVariant(
  score: number | null
): "success" | "warning" | "danger" | "secondary" {
  if (score == null) return "secondary";
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

export function ReadinessCard({
  score,
  recommendation,
  swim,
  bike,
  run,
}: ReadinessCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Readiness heute</CardTitle>
        <CardDescription>HRV · Schlaf · Fatigue · Body Battery</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold tabular-nums">
            {score ?? "—"}
          </span>
          {score != null && (
            <Badge variant={scoreVariant(score)}>/ 100</Badge>
          )}
        </div>
        {recommendation && (
          <p className="text-sm text-muted-foreground">{recommendation}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant={scoreVariant(swim)}>Swim {swim ?? "—"}</Badge>
          <Badge variant={scoreVariant(bike)}>Bike {bike ?? "—"}</Badge>
          <Badge variant={scoreVariant(run)}>Run {run ?? "—"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
