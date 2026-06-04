---
layout: default
title: Start
---

# Personal OS — Dokumentation

Dein persönliches Betriebssystem für **Triathlon-Training**, **Schule**, **Projekte** und **KI-Coaching** — als Web-App und **Android-App** (PWA).

## Schnellnavigation

| Thema | Beschreibung |
|-------|----------------|
| [Ersteinrichtung](setup) | Supabase, `.env.local`, Migrationen, lokaler Start |
| [Android-App (PWA)](android-app) | Zum Startbildschirm hinzufügen, Push, Offline |
| [Vercel Deploy](vercel-deploy) | GitHub → Vercel, Umgebungsvariablen, Cron |
| [Integrationen](integrations) | Garmin, Google Kalender, Groq, optional Strava |
| [Datenbank](database) | Migrationen in der richtigen Reihenfolge |
| [FAQ](faq) | Häufige Fehler und Lösungen |

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

[Repository auf GitHub](https://github.com/) · [PLANNING.md](../PLANNING.md) im Repo
