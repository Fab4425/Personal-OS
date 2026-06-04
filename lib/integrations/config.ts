import { readEnvCredential } from "@/lib/env/credentials";

export function isGarminConfigured(): boolean {
  return Boolean(
    readEnvCredential(process.env.GARMIN_EMAIL) &&
      readEnvCredential(process.env.GARMIN_PASSWORD)
  );
}

export function isStravaConfigured(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID?.trim() &&
      process.env.STRAVA_CLIENT_SECRET?.trim()
  );
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_REDIRECT_URI?.trim()
  );
}

export function getStravaUnavailableMessage(): string {
  return "Strava ist nicht konfiguriert (API-Zugang erfordert Strava-Developer-Account). Garmin und Google Kalender funktionieren unabhängig davon.";
}
