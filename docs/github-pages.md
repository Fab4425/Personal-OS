---
layout: default
title: GitHub Pages
---

# GitHub Pages einrichten

Diese Dokumentation wird automatisch aus dem Ordner `docs/` gebaut.

**Ziel-URL:** [https://fab4425.github.io/Personal-OS/](https://fab4425.github.io/Personal-OS/)

## Einmalig im Repository

1. Öffne [github.com/Fab4425/Personal-OS/settings/pages](https://github.com/Fab4425/Personal-OS/settings/pages)
2. Unter **Build and deployment** → **Source** wählen: **GitHub Actions**
   (nicht „Deploy from branch“, wenn der Workflow `deploy-docs.yml` genutzt wird)
3. Nach dem nächsten Push auf `main` (oder manuell unter **Actions** → Workflow starten) erscheint die Site nach 1–3 Minuten.

## Automatischer Deploy

Der Workflow [.github/workflows/deploy-docs.yml](https://github.com/Fab4425/Personal-OS/blob/main/.github/workflows/deploy-docs.yml) läuft bei Änderungen in `docs/`:

- Jekyll-Theme: Cayman
- Konfiguration: `docs/_config.yml` (`baseurl: /Personal-OS`)

Status prüfen: [Actions](https://github.com/Fab4425/Personal-OS/actions)

## Doku lokal bearbeiten

Optional mit Ruby/Jekyll lokal (nicht nötig für die Online-Version):

```bash
cd docs
gem install bundler
bundle init
# github-pages gem hinzufügen, dann:
bundle exec jekyll serve --baseurl "/Personal-OS"
```

Einfacher: Markdown in `docs/` editieren, committen, pushen — GitHub Actions baut neu.

## Hinweis

- **GitHub Pages** = nur diese Dokumentation  
- **Vercel** = die laufende Personal-OS-App
