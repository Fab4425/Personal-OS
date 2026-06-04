---
layout: default
title: Start
---

# Personal OS — Dokumentation

Dein persönliches Betriebssystem für **Triathlon-Training**, **Schule**, **Projekte** und **KI-Coaching** — als Web-App und **Android-App** (PWA).

**Live-App (Vercel):** nach Deploy unter deiner Vercel-URL  
**Quellcode:** [github.com/Fab4425/Personal-OS](https://github.com/Fab4425/Personal-OS)

## Schnellnavigation

| Thema | Beschreibung |
|-------|----------------|
| [Ersteinrichtung]({{ site.baseurl }}/setup.html) | Supabase, `.env.local`, Migrationen, lokaler Start |
| [Android-App (PWA)]({{ site.baseurl }}/android-app.html) | Zum Startbildschirm hinzufügen, Push, Offline |
| [Vercel Deploy]({{ site.baseurl }}/vercel-deploy.html) | GitHub → Vercel, Umgebungsvariablen, Cron |
| [GitHub Pages]({{ site.baseurl }}/github-pages.html) | Diese Doku veröffentlichen |
| [Integrationen]({{ site.baseurl }}/integrations.html) | Garmin, Google Kalender, Groq, optional Strava |
| [Datenbank]({{ site.baseurl }}/database.html) | Migrationen in der richtigen Reihenfolge |
| [FAQ]({{ site.baseurl }}/faq.html) | Häufige Fehler und Lösungen |
| [Claude Trainingsplan JSON]({{ site.baseurl }}/claude-training-plan-prompt.html) | Wochenplan per KI importieren |

## Module der App

| Route | Funktion |
|-------|----------|
| `/` | Dashboard: Readiness, Training heute, Wochen-Review |
| `/training` | ATL/CTL/TSB, Schlaf, Disziplinen |
| `/calendar` | FullCalendar + Google Sync |
| `/today` | Top 3, Habits, Pomodoro, Wochen-Review |
| `/academic` | 12 Fächer, mündlich/schriftlich, Notenschnitt |
| `/projects` | Kanban |
| `/chat` | KI Coach (Groq) |
| `/analytics` | Heatmap, Triathlon-Volumen |
| `/settings` | Sync & Integrationen |

## Tech-Stack

Next.js 14 · Supabase (Auth + Postgres) · Groq · Garmin Connect · Google Calendar · Vercel · PWA

[Repository](https://github.com/Fab4425/Personal-OS) · [PLANNING.md](https://github.com/Fab4425/Personal-OS/blob/main/PLANNING.md)
