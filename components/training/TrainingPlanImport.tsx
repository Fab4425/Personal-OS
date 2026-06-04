"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileJson, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CLAUDE_PROMPT = `Du erstellst einen Wochentrainingsplan als JSON für "Personal OS".
Antworte NUR mit gültigem JSON (kein Markdown).

{
  "version": 1,
  "plan_name": "Name der Woche",
  "week_start": "yyyy-MM-dd (Montag)",
  "week_notes": "optional",
  "workouts": [
    {
      "day": "monday",
      "discipline": "swim|bike|run|gym|race",
      "title": "Titel",
      "duration_min": 60,
      "distance_km": 40,
      "target_tss": 50,
      "intensity": "easy|moderate|hard",
      "structure": [{ "type": "warmup", "duration_min": 10, "zone": "Z1" }]
    }
  ]
}

Meine Woche: [Beschreibe Ziel, Stunden, Schwerpunkte, Ruhetage]`;

export function TrainingPlanImport({
  onImported,
}: {
  onImported?: () => void;
} = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function importAllTsve() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/training/plan/import-all", {
      method: "POST",
    });
    const data = (await res.json()) as {
      error?: string;
      weeks?: number;
      totalWorkouts?: number;
      plans?: { planName: string; weekStart: string }[];
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Import fehlgeschlagen");
      return;
    }

    setMessage(
      `TSVE 6-Wochen-Plan importiert: ${data.weeks} Wochen, ${data.totalWorkouts} Einheiten gesamt.`
    );
    onImported?.();
    router.refresh();
  }

  async function uploadFile(file: File) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/training/plan/import", {
      method: "POST",
      body: form,
    });

    const data = (await res.json()) as {
      error?: string;
      planName?: string;
      workoutsImported?: number;
      weekStart?: string;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Import fehlgeschlagen");
      return;
    }

    setMessage(
      `„${data.planName}" importiert: ${data.workoutsImported} Einheiten (Woche ab ${data.weekStart}).`
    );
    onImported?.();
    router.refresh();
  }

  function copyPrompt() {
    void navigator.clipboard.writeText(CLAUDE_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileJson className="h-4 w-4" />
          Trainingsplan importieren
        </CardTitle>
        <CardDescription>
          TrainingPeaks-Style: JSON von Claude hochladen — die App übernimmt die
          ganze Woche. Beispiel:{" "}
          <a
            href="/examples/training-week.example.json"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            training-week.example.json
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={loading}
            onClick={() => void importAllTsve()}
          >
            {loading ? "Import…" : "TSVE 6 Wochen importieren"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Einzelne JSON-Datei
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copyPrompt}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Claude-Prompt kopieren
          </Button>
        </div>
        {message && (
          <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
