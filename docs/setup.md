---
layout: default
title: Ersteinrichtung
---

# Ersteinrichtung

## Voraussetzungen

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** (mit Node mitgeliefert)
- Kostenlose Accounts: [Supabase](https://supabase.com), optional [Groq](https://console.groq.com), [Vercel](https://vercel.com)

## 1. Repository klonen

```bash
git clone https://github.com/DEIN-USER/personal-os.git
cd personal-os
npm install
npm run icons
```

`npm run icons` erzeugt `public/icon-192.png` und `icon-512.png` für die Android-App.

## 2. Supabase-Projekt

1. Neues Projekt auf [supabase.com](https://supabase.com) erstellen.
2. **SQL Editor** → alle Migrationen **in dieser Reihenfolge** ausführen:
   - `supabase/migrations/20250604000000_initial_schema.sql`
   - `supabase/migrations/20250604100000_phase2_sync.sql`
   - `supabase/migrations/20250604200000_academic_subjects.sql`
   - `supabase/migrations/20250604300000_push_subscriptions.sql`
3. **Authentication → Providers**: Email aktivieren; optional Google OAuth.
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (später Production-URL)
   - Redirect URLs:
     - `http://localhost:3000/callback`
     - `https://DEINE-DOMAIN.vercel.app/callback` (nach Deploy)

Unter **Project Settings → API** findest du URL und `anon` key.

## 3. Umgebungsvariablen

```bash
cp .env.example .env.local
```

Mindestens eintragen:

| Variable | Beschreibung |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (Cron, Admin) |
| `GROQ_API_KEY` | KI Chat & Wochen-Review |
| `CRON_SECRET` | Zufälliger String (z. B. `openssl rand -hex 32`) |

Details zu allen Keys: siehe [Integrationen](integrations).

## 4. Entwicklungsserver

```bash
npm run dev
```

Browser: [http://localhost:3000](http://localhost:3000) → Registrieren / Login.

Bei Cache-Problemen:

```bash
npm run dev:clean
```

## 5. Erste Schritte in der App

1. **Einstellungen** → Garmin synchronisieren (wenn konfiguriert).
2. **Einstellungen** → Google Kalender verbinden (optional).
3. **Akademie** → Fächer sind vorgelegt, Noten eintragen.
4. **Heute** → Wochen-Review „Generieren“ (testet Groq).
