import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReadinessAmpelProps {
  swim: number | null;
  bike: number | null;
  run: number | null;
  overall: number | null;
  recommendation: string | null;
}

function ampelColor(score: number | null): string {
  if (score == null) return "bg-muted";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function DisciplineAmpel({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "h-10 w-10 rounded-full border-2 border-border shadow-inner",
          ampelColor(score)
        )}
        title={score != null ? `${score}/100` : "—"}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {score != null ? `${score}/100` : "—"}
        </p>
      </div>
    </div>
  );
}

export function ReadinessAmpel({
  swim,
  bike,
  run,
  overall,
  recommendation,
}: ReadinessAmpelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Readiness Ampel</CardTitle>
        <CardDescription>
          Gesamt: {overall ?? "—"}/100
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <DisciplineAmpel label="Schwimmen" score={swim} />
          <DisciplineAmpel label="Rad" score={bike} />
          <DisciplineAmpel label="Laufen" score={run} />
        </div>
        {recommendation && (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            {recommendation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
