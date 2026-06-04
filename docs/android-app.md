---
layout: default
title: Android-App (PWA)
---

# Personal OS als Android-App nutzen

Personal OS ist eine **Progressive Web App (PWA)**. Du installierst sie wie eine App — **ohne Google Play Store**, direkt aus Chrome.

## Voraussetzungen

| Anforderung | Warum |
|-------------|--------|
| **HTTPS** | PWA-Install funktioniert nur über sichere Verbindung (Vercel liefert das automatisch) |
| **Chrome** (empfohlen) | Beste PWA-Unterstützung auf Android |
| **Icons** | `npm run icons` einmal ausführen (192×192 und 512×512 PNG) |
| **Deployed URL** | Lokal nur zum Testen; fürs Handy: Vercel-Deploy (siehe [Vercel Deploy](vercel-deploy)) |

## Installation Schritt für Schritt

### 1. App online bereitstellen

Deploy auf Vercel (siehe [vercel-deploy.md](vercel-deploy)). Notiere deine URL, z. B.:

`https://personal-os-xyz.vercel.app`

### 2. Auf dem Android-Handy öffnen

1. **Chrome** öffnen (nicht nur In-App-Browser von Instagram o. Ä.).
2. URL der deployed App eingeben und **einloggen**.

### 3. Zum Startbildschirm hinzufügen

**Variante A — Install-Banner**

- Wenn Chrome „App installieren“ anbietet → tippen und bestätigen.

**Variante B — Manuell**

1. Menü **⋮** (oben rechts)
2. **App installieren** oder **Zum Startbildschirm hinzufügen**
3. Name bestätigen (z. B. „Personal OS“)
4. **Hinzufügen**

Die App erscheint wie eine native App mit eigenem Icon (Indigo, Sonne-Symbol).

### 4. Nutzung

- Start über das **Homescreen-Icon** — Vollbild ohne Browser-Leiste (`display: standalone`).
- Bottom-Navigation: Home, Training, Heute, Kalender, Coach.
- **Offline**: Basis-Assets werden gecacht; Login und Sync brauchen Internet.

## Push-Benachrichtigungen (optional)

1. Auf dem Server VAPID-Keys setzen (siehe `.env.example`).
2. In der App: **Einstellungen** → **Push-Benachrichtigungen aktivieren**.
3. Berechtigung in Android erlauben.
4. Nach **Wochen-Review** (Sonntag oder manuell) kann eine Systemnachricht erscheinen.

## Tipps

| Problem | Lösung |
|---------|--------|
| Kein „App installieren“ | HTTPS prüfen; Icons vorhanden?; einmal Seite neu laden |
| Login schlägt fehl | Supabase Redirect URL muss **exakt** deine Vercel-URL + `/callback` enthalten |
| Alte Version | Chrome → App-Info → Speicher leeren, oder PWA deinstallieren und neu installieren |
| Samsung Internet | Menü → **Seite hinzufügen zu** → **Startbildschirm** |

## Play Store?

Für den **Google Play Store** bräuchtest du ein **Trusted Web Activity (TWA)**-Wrapper (z. B. [PWABuilder](https://www.pwabuilder.com/)). Für den persönlichen Gebrauch reicht die PWA auf dem Startbildschirm völlig aus.

## Technische Details

- Manifest: `public/manifest.json`
- Service Worker: `public/sw.js` (Cache + Push)
- Registrierung: automatisch in `app/layout.tsx`
