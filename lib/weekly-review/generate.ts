import { chatWithGroq, type GroqMessage } from "@/lib/ai/groq";
import { formatGrade } from "@/lib/academic/grades";
import type { WeeklyStats } from "@/lib/weekly-review/aggregate";

export interface WeeklyAiContent {
  summary: string;
  tips: string;
}

function buildStatsPrompt(stats: WeeklyStats, userName: string): string {
  const habitPct =
    stats.habitCompletionRate != null
      ? `${Math.round(stats.habitCompletionRate * 100)} %`
      : "keine Habits";
  const academic =
    stats.academicAverage != null
      ? formatGrade(stats.academicAverage)
      : "—";

  return `Erstelle ein Wochen-Review für ${userName}.
Zeitraum: ${stats.weekStart} bis ${stats.weekEnd}

Training:
- ${stats.workoutCount} Einheiten, ${stats.totalTrainingHours} h gesamt
- Swim ${stats.totalSwimKm} km, Bike ${stats.totalBikeKm} km, Run ${stats.totalRunKm} km
- Readiness-Schnitt: ${stats.avgReadiness ?? "—"}/100

Habits erledigt: ${habitPct}
Notendurchschnitt (1–6): ${academic}
Ziele erreicht (Habits/Training/Readiness): ${stats.goalsMet.map((g) => (g ? "ja" : "nein")).join(", ")}

Antworte auf Deutsch in genau zwei Abschnitten mit diesen Überschriften:
## Zusammenfassung
(kurz, 3–5 Sätze, datenbasiert)

## Tipps
(3 konkrete Empfehlungen für nächste Woche)`;
}

export function parseWeeklyAiResponse(text: string): WeeklyAiContent {
  const parts = text.split(/##\s*Tipps/i);
  if (parts.length >= 2) {
    const summary = parts[0]
      .replace(/##\s*Zusammenfassung/i, "")
      .trim();
    return { summary, tips: parts.slice(1).join("").trim() };
  }
  return { summary: text.trim(), tips: "" };
}

export async function generateWeeklyReviewAi(
  stats: WeeklyStats,
  userName: string
): Promise<WeeklyAiContent> {
  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        "Du bist ein Triathlon- und Produktivitäts-Coach. Sei präzise und motivierend.",
    },
    { role: "user", content: buildStatsPrompt(stats, userName) },
  ];

  const raw = await chatWithGroq(messages);
  return parseWeeklyAiResponse(raw);
}
