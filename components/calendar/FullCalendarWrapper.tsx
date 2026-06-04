"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import deLocale from "@fullcalendar/core/locales/de";
import type { EventInput } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";

const typeColors: Record<string, string> = {
  training: "#3b82f6",
  academic: "#22c55e",
  project: "#eab308",
  personal: "#a1a1aa",
};

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
}

interface FullCalendarWrapperProps {
  events: CalendarEvent[];
}

export function FullCalendarWrapper({ events: initial }: FullCalendarWrapperProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const fcEvents: EventInput[] = useMemo(
    () =>
      initial.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: typeColors[e.type] ?? typeColors.personal,
        borderColor: typeColors[e.type] ?? typeColors.personal,
      })),
    [initial]
  );

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/calendar/sync", { method: "POST" });
    setSyncing(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? "Sync…" : "Google Sync"}
        </Button>
        {Object.entries(typeColors).map(([type, color]) => (
          <span
            key={type}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {type}
          </span>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-2 [&_.fc]:text-foreground">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale={deLocale}
          height="auto"
          events={fcEvents}
          editable
          eventDrop={async (info) => {
            if (!info.event.id) return;
            await fetch("/api/calendar/events", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: info.event.id,
                start_at: info.event.start?.toISOString(),
                end_at:
                  info.event.end?.toISOString() ??
                  info.event.start?.toISOString(),
              }),
            });
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
