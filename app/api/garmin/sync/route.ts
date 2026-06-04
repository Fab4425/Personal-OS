import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCronRequest } from "@/lib/api/cron-auth";
import { syncGarminForUser } from "@/lib/garmin/sync";
import { resetGarminClientCache } from "@/lib/garmin/client";
import { isGarminConfigured } from "@/lib/integrations/config";
import { calculateReadinessForUser } from "@/lib/readiness/calculate";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isGarminConfigured()) {
    return NextResponse.json(
      { error: "Garmin nicht konfiguriert (GARMIN_EMAIL / GARMIN_PASSWORD)" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGarminForUser(supabase, user.id);
    const readiness = await calculateReadinessForUser(supabase, user.id);
    return NextResponse.json({ ...result, readiness });
  } catch (err) {
    resetGarminClientCache();
    const message = err instanceof Error ? err.message : "Garmin sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGarminConfigured()) {
    return NextResponse.json({ ok: true, skipped: "Garmin not configured" });
  }

  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin.from("profiles").select("id");
    if (error) throw error;

    const results = [];
    for (const profile of profiles ?? []) {
      const syncResult = await syncGarminForUser(admin, profile.id);
      const readiness = await calculateReadinessForUser(admin, profile.id);
      results.push({ userId: profile.id, ...syncResult, readiness });
    }

    return NextResponse.json({ ok: true, users: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
