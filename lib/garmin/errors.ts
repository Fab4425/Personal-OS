export function formatGarminLoginError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("mfa") || lower.includes("ticket not found")) {
    return [
      "Garmin erfordert MFA (Zwei-Faktor-Authentifizierung).",
      "Die Bibliothek kann MFA nicht im Browser lösen.",
      "Lösung: Einmalig im Terminal ausführen:",
      "npm run garmin:login",
      "Danach werden Tokens in .garmin-tokens gespeichert und der Sync nutzt diese.",
    ].join(" ");
  }

  if (lower.includes("accountlocked") || lower.includes("account locked")) {
    return "Garmin-Konto gesperrt — einmal im Browser auf connect.garmin.com anmelden und entsperren.";
  }

  if (lower.includes("username and password") || lower.includes("login failed")) {
    return [
      "Garmin-Anmeldung fehlgeschlagen.",
      "Prüfe GARMIN_EMAIL / GARMIN_PASSWORD in .env.local (ohne Anführungszeichen, gleiche Daten wie connect.garmin.com).",
      "Bei MFA: npm run garmin:login ausführen.",
      `Technisch: ${raw}`,
    ].join(" ");
  }

  if (lower.includes("update phone")) {
    return "Garmin verlangt eine Telefonnummer-Aktualisierung — bitte zuerst auf connect.garmin.com im Browser erledigen.";
  }

  return raw;
}
