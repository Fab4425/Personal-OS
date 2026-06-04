---
layout: default
title: Claude Trainingsplan JSON
---

# Trainingsplan per Claude (JSON-Import)

Kopiere den folgenden Prompt in **Claude** (oder einen anderen Chat). Claude erzeugt eine `.json`-Datei, die du in Personal OS unter **Training → Plan importieren** hochlädst.

## Prompt für Claude

```
Du erstellst einen Wochentrainingsplan als JSON für die App "Personal OS".
Antworte NUR mit gültigem JSON (kein Markdown, keine Erklärung).

Schema:
{
  "version": 1,
  "plan_name": "string",
  "week_start": "yyyy-MM-dd (Montag dieser Woche)",
  "week_notes": "optional",
  "workouts": [
    {
      "day": "monday|tuesday|...|sunday ODER date: yyyy-MM-dd",
      "discipline": "swim|bike|run|gym|race",
      "title": "string",
      "description": "optional",
      "duration_min": number,
      "distance_km": number optional,
      "target_tss": number optional,
      "intensity": "easy|moderate|hard|rest optional",
      "structure": [
        { "type": "warmup|main|interval|recovery|cooldown|drills", "duration_min": number, "zone": "optional", "notes": "optional" }
      ]
    }
  ]
}

Athlet: [DEIN NAME]
Ziel: [z.B. Olympic Triathlon im September]
Diese Woche: [z.B. Build, 8–10 h, Schwerpunkt Rad]
Besonderheiten: [z.B. Mittwoch nur 30 min, Samstag Wettkampf]

Beispiel-Datei im Repo: public/examples/training-week.example.json
```

## Nach dem Export

1. JSON als Datei speichern (z. B. `woche-12.json`)
2. Personal OS → **Training** → **Plan importieren** → Datei wählen
3. Geplante Einheiten erscheinen in der Wochenübersicht
4. Nach Garmin-Sync werden erledigte Einheiten automatisch als **erledigt** markiert

## Felder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `plan_name` | ja | Name der Woche |
| `week_start` | ja | Montag `yyyy-MM-dd` |
| `day` oder `date` | ja pro Workout | Wochentag oder festes Datum |
| `discipline` | ja | swim, bike, run, gym, race |
| `title` | ja | Kurztitel |
| `duration_min` | empfohlen | Soll-Dauer |
| `target_tss` | optional | Geplante Belastung |
| `structure` | optional | Intervalle wie TrainingPeaks |
