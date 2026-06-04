---
layout: default
title: Integrationen
---

# Integrationen & API-Keys

## Supabase (Pflicht)

| Variable | Woher |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (geheim!) |

## Groq — KI Coach & Wochen-Review

| Variable | Woher |
|----------|--------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |

Ohne Key: Chat und KI-Text im Wochen-Review funktionieren nicht.

## Google Kalender

1. [Google Cloud Console](https://console.cloud.google.com) → neues Projekt.
2. **APIs & Services → Library** → **Google Calendar API** aktivieren.
3. **OAuth consent screen** → External, Test user = deine Gmail.
4. **Credentials → OAuth 2.0 Client ID** → Web application.
5. Redirect URIs:
   - Lokal: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://DEINE-DOMAIN.vercel.app/api/auth/google/callback`

| Variable | Wert |
|----------|------|
| `GOOGLE_CLIENT_ID` | Client ID |
| `GOOGLE_CLIENT_SECRET` | Client Secret |
| `GOOGLE_REDIRECT_URI` | leer lassen (wird aus Request abgeleitet) |

**Fehler 403 access_denied:** Testnutzer unter OAuth consent screen hinzufügen.

## Garmin Connect

| Variable | Beschreibung |
|----------|--------------|
| `GARMIN_EMAIL` | Garmin-Konto |
| `GARMIN_PASSWORD` | Ohne Anführungszeichen in `.env` |

**MFA aktiv:** lokal `npm run garmin:login` → Tokens in `.garmin-tokens/` (nicht committen).

Sync: **Einstellungen** in der App oder Cron täglich 06:00 UTC.

## Strava (optional)

Leer lassen = kein Strava-Sync, App läuft normal.

## Web Push (optional)

```bash
npx web-push generate-vapid-keys
```

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | public key |
| `VAPID_PRIVATE_KEY` | private key |

## Vercel Cron

| Variable | Beschreibung |
|----------|--------------|
| `CRON_SECRET` | Beliebiger langer Zufallsstring; muss mit Vercel-Cron-Header übereinstimmen |

## App-URL

| Variable | Beispiel |
|----------|----------|
| `NEXT_PUBLIC_SITE_URL` | `https://personal-os.vercel.app` |

Wichtig für OAuth-Redirects und Push.
