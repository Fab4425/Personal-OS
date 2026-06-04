import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCronRequest } from "@/lib/api/cron-auth";
import { syncGarminForUser } from "@/lib/garmin/sync";
import { calculateReadinessForUser } from "@/lib/readiness/calculate";
import { isGarminConfigured } from "@/lib/integrations/config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGarminConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const admin = createAdminClient();
    const { data: profiles } = await admin.from("profiles").select("id");

    let synced = 0;
    for (const profile of profiles ?? []) {
      await syncGarminForUser(admin, profile.id);
      await calculateReadinessForUser(admin, profile.id);
      synced += 1;
    }

    return NextResponse.json({ ok: true, synced });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Garmin cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
