"use client";

import dynamic from "next/dynamic";

const FullCalendarWrapper = dynamic(
  () =>
    import("@/components/calendar/FullCalendarWrapper").then(
      (m) => m.FullCalendarWrapper
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Kalender wird geladen…</p>
    ),
  }
);

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  return <FullCalendarWrapper events={events} />;
}
