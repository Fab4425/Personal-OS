import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importTsveSixWeekPlans } from "@/lib/training/import-all-plans";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await importTsveSixWeekPlans(supabase, user.id);
    const totalWorkouts = results.reduce(
      (s, r) => s + r.workoutsImported,
      0
    );
    return NextResponse.json({
      ok: true,
      weeks: results.length,
      totalWorkouts,
      plans: results,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Import all failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
