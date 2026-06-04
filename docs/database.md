---
layout: default
title: Datenbank
---

# Datenbank-Migrationen

Alle SQL-Dateien liegen in `supabase/migrations/`. Im Supabase **SQL Editor** nacheinander ausführen.

| Datei | Inhalt |
|-------|--------|
| `20250604000000_initial_schema.sql` | Profile, Workouts, Health, Readiness, Kalender, Projekte, Habits, Chat, `weekly_reviews` |
| `20250604100000_phase2_sync.sql` | `external_id` für Workouts, Sync-Felder |
| `20250604200000_academic_subjects.sql` | Fächer mit mündlich/schriftlich, Noten-Verlauf |
| `20250604300000_push_subscriptions.sql` | Web-Push Endpoints |

## Wichtige Tabellen

- `workouts` — Garmin/Strava Einheiten
- `readiness_scores` — Tägliche Readiness
- `academic_subjects` / `academic_grade_history` — Schule
- `weekly_reviews` — Wochen-Review inkl. KI-Text
- `calendar_events` — Kalender + Google Sync

Row Level Security (RLS) ist aktiv — jeder Nutzer sieht nur eigene Daten.

## CLI (optional)

Mit [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref DEIN-PROJECT-REF
supabase db push
```
