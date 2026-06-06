"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { revalidateTraining } from "@/lib/swr/training";

export function TrainingSyncButton() {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function syncGarmin() {
    setSyncing(true);
    setMessage(null);
    const res = await fetch("/api/garmin/sync", { method: "POST" });
    const data = await res.json();
    setSyncing(false);

    if (!res.ok) {
      setMessage(data.error ?? "Sync fehlgeschlagen");
      return;
    }

    const errHint =
      data.workoutErrors?.length > 0
        ? ` · ${data.workoutErrors.join("; ")}`
        : "";
    setMessage(
      `${data.workoutsUpserted} Workouts gespeichert (${data.activitiesFetched} von Garmin)${errHint}`
    );

    await revalidateTraining(weekParam);
    window.dispatchEvent(new CustomEvent("personal-os:garmin-synced"));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => void syncGarmin()}
        disabled={syncing}
      >
        {syncing ? "Synchronisiere…" : "Garmin synchronisieren"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
