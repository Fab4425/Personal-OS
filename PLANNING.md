# Personal OS – Projektspezifikation

> Triathlon · Produktivität · KI · Google Kalender  
> Stack: Next.js 14 · Supabase · Groq · Vercel · PWA

Vollständige Feature- und Schema-Beschreibung — siehe ursprüngliche Projektspezifikation im Repo-Chat / Dokumentation.

## Build-Reihenfolge

### Phase 1 – Fundament ✅

- [x] Next.js 14 Projekt
- [x] Tailwind + shadcn/ui
- [x] Supabase Schema (Migration)
- [x] Auth (Email + Google OAuth)
- [x] Sidebar + Dark Mode
- [x] Grundlayout aller Seiten
- [x] PWA Manifest + Service Worker

### Phase 2 – Daten-Integration ✅

- [x] Strava optional (503 wenn nicht konfiguriert — kein Premium nötig für App)
- [x] Garmin Connect Sync (`garmin-connect` + `.env` Credentials)
- [x] Google Calendar OAuth + bidirektionaler Sync
- [x] Vercel Cron Jobs (täglich 06:00: Garmin + Kalender + Readiness; So 20:00 Review — Hobby-kompatibel)
- [x] Readiness Score Berechnung

### Phase 3 – Module ✅

- [x] Training Dashboard (ATL/CTL/TSB, Disziplin-Tabs, Wochenvolumen)
- [x] Schlaf-Dashboard (Trend-Chart)
- [x] Readiness Ampel
- [x] Kalender (FullCalendar + Drag & Sync)
- [x] Tagesplaner (Top 3, Habits, Pomodoro)
- [x] KI Chat UI (Groq + Live-Kontext)
- [x] Projekt Kanban
- [x] Akademie (Noten + Ø)
- [x] Analytics (Heatmap, Triathlon-Jahr)

### Phase 4 – Polish & Launch

- [x] Wochen-Review Cron (Sonntag 20:00) + KI-Zusammenfassung (Groq)
- [x] Wochen-Review UI (Heute + Übersicht, manuell generieren)
- [x] Push Notifications (VAPID + Service Worker, optional)
- [x] Mobile Optimierung (Safe Area, Bottom Nav)
- [ ] Vercel Deploy (siehe README)

## Projektstruktur

```
app/(auth)/login, callback
app/(dashboard)/training, calendar, today, projects, academic, analytics, chat
app/api/...
components/layout, ui
lib/supabase, ai, garmin, strava, google (Phase 2+)
supabase/migrations/
public/manifest.json, sw.js
```
