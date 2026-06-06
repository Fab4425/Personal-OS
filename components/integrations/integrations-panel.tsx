"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PushNotificationsToggle } from "@/components/push/PushNotificationsToggle";

interface IntegrationStatus {
  garmin: {
    configured: boolean;
    connected: boolean;
    lastSync: string | null;
    tokensSaved?: boolean;
    tokenPath?: string;
  };
  google: {
    configured: boolean;
    connected: boolean;
    lastSync: string | null;
    redirectUri?: string;
  };
  strava: {
    configured: boolean;
    connected: boolean;
    lastSync: string | null;
    note: string | null;
  };
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Noch nie";
  return new Date(iso).toLocaleString("de-DE");
}

export function IntegrationsPanel() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/integrations/status");
    if (res.ok) {
      setStatus(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
    const google = searchParams.get("google");
    if (google === "connected") {
      setMessage("Google Kalender erfolgreich verbunden.");
    } else if (google === "error") {
      const reason = searchParams.get("reason");
      if (reason === "access_denied") {
        setMessage(
          "Google 403 access_denied: Deine E-Mail muss unter OAuth consent screen → Test users eingetragen sein (siehe Anleitung unten). Die Anmeldung muss dieselbe Gmail-Adresse sein."
        );
      } else if (
        reason === "redirect_uri_mismatch" ||
        reason?.includes("redirect")
      ) {
        setMessage(
          "Google redirect_uri_mismatch — unten die Redirect-URI exakt in der Google Cloud Console eintragen."
        );
      } else {
        setMessage(
          `Google-Verbindung fehlgeschlagen${reason ? ` (${reason})` : ""}.`
        );
      }
    }
  }, [loadStatus, searchParams]);

  async function syncGarmin() {
    setSyncing("garmin");
    setMessage(null);
    const res = await fetch("/api/garmin/sync", { method: "POST" });
    const data = await res.json();
    setSyncing(null);
    if (!res.ok) {
      setMessage(data.error ?? "Garmin-Sync fehlgeschlagen");
      return;
    }
    const errHint =
      data.workoutErrors?.length > 0
        ? ` Fehler: ${data.workoutErrors.join("; ")}`
        : data.workoutsUpserted === 0 && data.activitiesFetched > 0
          ? " (0 Workouts gespeichert — prüfe Sync-Meldung / Supabase-Migration)"
          : "";
    setMessage(
      `Garmin: ${data.workoutsUpserted} Workouts (${data.activitiesFetched} von Garmin), ${data.healthDaysUpserted} Gesundheitstage. Readiness: ${data.readiness?.overall_score ?? "—"}${errHint}`
    );
    loadStatus();
    window.dispatchEvent(new CustomEvent("personal-os:garmin-synced"));
  }

  async function syncCalendar() {
    setSyncing("google");
    setMessage(null);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    const data = await res.json();
    setSyncing(null);
    if (!res.ok) {
      setMessage(data.error ?? "Kalender-Sync fehlgeschlagen");
      return;
    }
    setMessage(`Kalender: ${data.pulled} gezogen, ${data.pushed} gepusht.`);
    loadStatus();
  }

  async function calculateReadiness() {
    setSyncing("readiness");
    const res = await fetch("/api/readiness/calculate", { method: "POST" });
    const data = await res.json();
    setSyncing(null);
    if (!res.ok) {
      setMessage(data.error ?? "Readiness fehlgeschlagen");
      return;
    }
    setMessage(`Readiness: ${data.readiness.overall_score}/100`);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Lade Integrationen…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Garmin Connect</CardTitle>
          <CardDescription>
            Sync über .env-Credentials. Bei 2FA/MFA zuerst{" "}
            <code className="text-xs">npm run garmin:login</code> im Terminal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {status?.garmin.configured ? (
            <Badge variant="success">Konfiguriert</Badge>
          ) : (
            <Badge variant="danger">GARMIN_EMAIL/PASSWORD fehlen</Badge>
          )}
          {status?.garmin.tokensSaved && (
            <Badge variant="secondary">Tokens gespeichert</Badge>
          )}
          {status?.garmin.connected && (
            <span className="text-xs text-muted-foreground">
              Letzter Sync: {formatSyncTime(status.garmin.lastSync)}
            </span>
          )}
          <Button
            size="sm"
            disabled={!status?.garmin.configured || syncing === "garmin"}
            onClick={syncGarmin}
          >
            {syncing === "garmin" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Jetzt synchronisieren
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Google Kalender</CardTitle>
          <CardDescription>
            OAuth-Verbindung · bidirektionaler Sync (lokale Änderungen gewinnen bei
            Konflikt)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status?.google.redirectUri && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
              <p className="font-medium text-amber-200">
                Redirect-URI in Google Cloud Console (OAuth-Client → Authorized
                redirect URIs):
              </p>
              <code className="mt-1 block break-all text-amber-100/90">
                {status.google.redirectUri}
              </code>
            </div>
          )}
          {!status?.google.connected && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                Fehler „app has not completed verification“ / access_denied?
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>
                  <a
                    href="https://console.cloud.google.com/apis/credentials/consent"
                    className="text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Cloud → OAuth consent screen
                  </a>
                </li>
                <li>App ist im Modus <strong>Testing</strong> — das ist OK</li>
                <li>
                  Bereich <strong>Test users</strong> → Add users → deine Gmail
                  (z. B. fabfri013@gmail.com)
                </li>
                <li>Speichern, 1–2 Min warten, erneut „Mit Google verbinden“</li>
              </ol>
              <p className="mt-2">
                Keine Google-Verifizierung nötig — nur für dich als Testnutzer.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
          {status?.google.configured ? (
            <Badge variant="success">API konfiguriert</Badge>
          ) : (
            <Badge variant="danger">Google OAuth env fehlt</Badge>
          )}
          {status?.google.connected ? (
            <>
              <Badge variant="secondary">Verbunden</Badge>
              <span className="text-xs text-muted-foreground">
                Letzter Sync: {formatSyncTime(status.google.lastSync)}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={syncing === "google"}
                onClick={syncCalendar}
              >
                {syncing === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync
              </Button>
            </>
          ) : (
            <Button size="sm" asChild disabled={!status?.google.configured}>
              <Link href="/api/integrations/google/connect">
                Mit Google verbinden
              </Link>
            </Button>
          )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strava</CardTitle>
          <CardDescription>
            Optional — erfordert Strava Developer API Keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {status?.strava.configured ? (
            <Badge variant="secondary">Keys gesetzt (Sync Phase 3+)</Badge>
          ) : (
            <>
              <Badge variant="outline">Nicht konfiguriert</Badge>
              <p className="text-sm text-muted-foreground">
                {status?.strava.note}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wochen-Review & Push</CardTitle>
          <CardDescription>
            Sonntags 20:00 per Cron · manuell unter Heute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PushNotificationsToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Readiness Score</CardTitle>
          <CardDescription>
            Berechnung aus HRV, Schlaf, Fatigue und Body Battery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="sm"
            variant="secondary"
            disabled={syncing === "readiness"}
            onClick={calculateReadiness}
          >
            {syncing === "readiness" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Readiness neu berechnen"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
