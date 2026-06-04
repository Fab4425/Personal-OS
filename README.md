# Personal OS

**Triathlon · Produktivität · KI · Google Kalender** — dein persönliches Dashboard als Web-App und **Android-App (PWA)**.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E)
![PWA](https://img.shields.io/badge/PWA-Android%20installierbar-6366f1)
![License](https://img.shields.io/badge/License-Private-blue)

---

## Inhaltsverzeichnis

- [Features](#features)
- [Screens & Module](#screens--module)
- [Schnellstart (lokal)](#schnellstart-lokal)
- [Android-App installieren](#android-app-installieren)
- [Auf Vercel deployen](#auf-vercel-deployen)
- [Dokumentation (GitHub Pages)](#dokumentation-github-pages)
- [Tech-Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Cron-Jobs](#cron-jobs)
- [Lizenz](#lizenz)

---

## Features

| Bereich | Funktionen |
|---------|------------|
| **Training** | Garmin-Sync, ATL/CTL/TSB, Readiness-Ampel, Schlaf/HRV, Disziplin-Tabs |
| **Kalender** | FullCalendar, Drag & Drop, Google Calendar Sync |
| **Heute** | Top-3-Ziele, Habits, Pomodoro, Wochen-Review (KI) |
| **Akademie** | 12 Fächer, mündlich/schriftlich, Gesamtnote, Schnitt-Verlauf |
| **Projekte** | Kanban (Idee → Fertig) |
| **KI Coach** | Groq-Chat mit Live-Kontext aus deinen Daten |
| **Analytics** | Trainings-Heatmap, Triathlon-km/Jahr |
| **PWA** | Installierbar auf Android, optional Push |

---

## Screens & Module

| Route | Beschreibung |
|-------|----------------|
| `/` | Dashboard |
| `/training` | Belastung & Recovery |
| `/calendar` | Termine |
| `/today` | Tagesplan & Review |
| `/academic` | Noten |
| `/projects` | Kanban |
| `/chat` | KI Coach |
| `/analytics` | Auswertungen |
| `/settings` | Integrationen |

---

## Schnellstart (lokal)

```bash
git clone https://github.com/DEIN-USER/personal-os.git
cd personal-os
npm install
npm run icons          # PWA-Icons für Android
cp .env.example .env.local
```

1. **Supabase:** Projekt anlegen, alle Dateien in `supabase/migrations/` nacheinander im SQL Editor ausführen.  
2. **`.env.local`:** mindestens Supabase URL/Keys, `GROQ_API_KEY`, `CRON_SECRET`.  
3. **Auth:** Redirect `http://localhost:3000/callback` in Supabase eintragen.  

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

Ausführlich: **[docs/setup.md](docs/setup.md)**

---

## Android-App installieren

Personal OS ist **keine Play-Store-App**, sondern eine **PWA**:

1. App auf **Vercel deployen** (HTTPS).
2. Auf dem Handy **Chrome** öffnen → deine Vercel-URL.
3. Einloggen → Menü **⋮** → **App installieren** / **Zum Startbildschirm hinzufügen**.

Voraussetzung: einmal `npm run icons` im Projekt (erzeugt `icon-192.png` / `icon-512.png`).

Ausführlich: **[docs/android-app.md](docs/android-app.md)**

---

## Auf Vercel deployen

```bash
git init
git add .
git commit -m "Personal OS"
git remote add origin https://github.com/DEIN-USER/personal-os.git
git push -u origin main
```

1. [vercel.com](https://vercel.com) → Import GitHub Repo.  
2. **Environment Variables:** komplette `.env.local` übernehmen.  
3. `NEXT_PUBLIC_SITE_URL` = `https://dein-projekt.vercel.app`  
4. Nach Deploy: Supabase + Google OAuth Redirects auf Production-URL anpassen.  

Ausführlich: **[docs/vercel-deploy.md](docs/vercel-deploy.md)**

---

## Dokumentation (GitHub Pages)

Im Ordner [`docs/`](docs/) liegt die vollständige Dokumentation (Deutsch):

| Seite | Thema |
|-------|--------|
| [docs/index.md](docs/index.md) | Übersicht |
| [docs/setup.md](docs/setup.md) | Ersteinrichtung |
| [docs/android-app.md](docs/android-app.md) | Android PWA |
| [docs/vercel-deploy.md](docs/vercel-deploy.md) | Vercel + GitHub |
| [docs/integrations.md](docs/integrations.md) | API-Keys |
| [docs/database.md](docs/database.md) | Migrationen |
| [docs/faq.md](docs/faq.md) | Fehlerbehebung |

### GitHub Pages aktivieren

1. Repository auf GitHub pushen.  
2. **Settings → Pages**  
3. Source: **Deploy from branch** → Branch `main` → Folder **`/docs`**  
4. Speichern → nach ~1 Min erreichbar unter:  

   `https://DEIN-USER.github.io/personal-os/`

Die **App** läuft auf Vercel; GitHub Pages zeigt nur die **Dokumentation**.

---

## Tech-Stack

- **Frontend:** Next.js 14, React 18, Tailwind, shadcn/ui, Recharts, FullCalendar  
- **Backend:** Supabase (Postgres, Auth, RLS), API Routes  
- **KI:** Groq (Llama 3.3)  
- **Integrationen:** Garmin Connect, Google Calendar, optional Strava  
- **Hosting:** Vercel (Cron, HTTPS, PWA)  

---

## Projektstruktur

```
app/(dashboard)/     # UI-Seiten
app/api/             # API & Cron
components/          # React-Komponenten
lib/                 # Garmin, AI, Training, Academic, …
supabase/migrations/ # SQL-Schema
docs/                # GitHub Pages Dokumentation
public/manifest.json # PWA
vercel.json          # Cron-Schedules
```

Spezifikation: [PLANNING.md](PLANNING.md)

---

## Cron-Jobs

| Schedule | Endpoint | Aufgabe |
|----------|----------|---------|
| `0 6 * * *` | `/api/cron/garmin-sync` | Garmin + Google Kalender + Readiness (täglich) |
| `0 20 * * 0` | `/api/cron/weekly-review` | Wochen-Review (So 20:00 UTC) |

Kalender jederzeit manuell: **Kalender** oder **Einstellungen** → Sync.

**Vercel Hobby:** nur Cron-Jobs mit höchstens 1× pro Tag (kein 15-Min-Intervall). Dafür sind nur diese zwei Einträge in `vercel.json`.

Benötigt `CRON_SECRET` in Vercel.

---

## Umgebungsvariablen

Siehe [.env.example](.env.example) und [docs/integrations.md](docs/integrations.md).

---

## Lizenz

Privates Projekt — Nutzung nach eigenem Ermessen.
