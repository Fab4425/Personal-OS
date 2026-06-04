---
layout: default
title: FAQ
---

# FAQ — Häufige Probleme

## Auth / Login

**Redirect nach Login schlägt fehl**

- Supabase → Redirect URLs müssen `https://DEINE-DOMAIN/callback` enthalten.
- Kein trailing slash bei Google Redirect URI.

**Google „access_denied“**

- OAuth App im Testing-Modus → deine Gmail als **Test user** eintragen.

## Garmin

**Login failed / MFA**

```bash
npm run garmin:login
```

Danach erneut sync in Einstellungen.

**Training leer / 0 Stunden**

- Erneut synchronisieren (Dauer wird aus Garmin neu berechnet).
- Cron läuft nur auf Vercel mit gültigem `CRON_SECRET`.

## Kalender

**Webpack-Fehler / weiße Seite**

```bash
npm run dev:clean
```

FullCalendar braucht `transpilePackages` in `next.config.mjs` (bereits gesetzt).

## Akademie

**Tabelle leer / Fehler**

- Migration `20250604200000_academic_subjects.sql` ausgeführt?
- Seite neu laden — Fächer werden automatisch angelegt.

## Android PWA

**Kein Install-Button**

- Nur über **HTTPS** (Vercel-URL, nicht `http://192.168...` ohne Zertifikat).
- `npm run icons` ausgeführt?
- Chrome verwenden.

## Vercel

**Cron läuft nicht**

- `CRON_SECRET` in Vercel Environment gesetzt?
- Hobby-Plan: Cron-Limits beachten.

**Build schlägt fehl**

- Alle `NEXT_PUBLIC_*` Variablen in Vercel gesetzt?
- Node 18+ (Vercel Standard).

## Entwicklung

**`Cannot find module './xxx.js'` in .next**

```bash
npm run dev:clean
```

oder `.next` Ordner löschen und `npm run build`.
