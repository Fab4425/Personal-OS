"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export function PushNotificationsToggle() {
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(
      "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
    setConfigured(Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY));
  }, []);

  async function subscribe() {
    if (!configured) {
      setStatus("VAPID-Keys in .env.local fehlen (siehe README).");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Benachrichtigungen nicht erlaubt.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setStatus(err.error ?? "Speichern fehlgeschlagen.");
      } else {
        setStatus("Push aktiv — Wochen-Review erscheint als Hinweis.");
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Fehler beim Abonnieren.");
    }

    setLoading(false);
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Push wird von diesem Browser nicht unterstützt.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={subscribe}
        disabled={loading || !configured}
      >
        {loading ? "…" : "Push-Benachrichtigungen aktivieren"}
      </Button>
      {!configured && (
        <p className="text-xs text-muted-foreground">
          Optional: VAPID-Keys setzen (npx web-push generate-vapid-keys).
        </p>
      )}
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
