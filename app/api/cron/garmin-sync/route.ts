import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCronRequest } from "@/lib/api/cron-auth";
import { syncGarminForUser } from "@/lib/garmin/sync";
import { syncCalendarForUser } from "@/lib/google/calendar-sync";
import { calculateReadinessForUser } from "@/lib/readiness/calculate";
import {
  isGarminConfigured,
  isGoogleCalendarConfigured,
} from "@/lib/integrations/config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Täglicher Cron (Vercel Hobby: max. 1×/Tag) — Garmin + Kalender + Readiness */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id");

  const garminResults: unknown[] = [];
  const calendarResults: unknown[] = [];

  try {
    if (isGarminConfigured()) {
      for (const profile of profiles ?? []) {
        const syncResult = await syncGarminForUser(admin, profile.id);
        const readiness = await calculateReadinessForUser(admin, profile.id);
        garminResults.push({ userId: profile.id, ...syncResult, readiness });
      }
    }

    if (isGoogleCalendarConfigured()) {
      const { data: accounts } = await admin
        .from("connected_accounts")
        .select("user_id")
        .eq("provider", "google")
        .not("refresh_token", "is", null);

      for (const account of accounts ?? []) {
        try {
          const result = await syncCalendarForUser(admin, account.user_id);
          calendarResults.push({ userId: account.user_id, ...result });
        } catch (err) {
          calendarResults.push({
            userId: account.user_id,
            error: err instanceof Error ? err.message : "sync failed",
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      garmin: isGarminConfigured() ? garminResults : { skipped: true },
      calendar: isGoogleCalendarConfigured()
        ? calendarResults
        : { skipped: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Daily cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
