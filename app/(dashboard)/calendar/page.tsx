import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { CalendarView } from "@/components/calendar/CalendarView";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, end_at, type")
    .eq("user_id", user!.id)
    .order("start_at", { ascending: true });

  const mapped = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start_at,
    end: e.end_at,
    type: e.type,
  }));

  return (
    <PageShell
      title="Kalender"
      description="FullCalendar · Google Sync"
      userEmail={user?.email}
      moduleName="Kalender"
    >
      <Button size="sm" variant="outline" asChild className="w-fit">
        <Link href="/settings">Google verbinden</Link>
      </Button>
      <CalendarView events={mapped} />
    </PageShell>
  );
}
