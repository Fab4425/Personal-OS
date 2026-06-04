import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCronRequest } from "@/lib/api/cron-auth";
import { runWeeklyReviewForUser } from "@/lib/weekly-review/run";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin.from("profiles").select("id");
    if (error) throw error;

    const results = [];
    for (const profile of profiles ?? []) {
      const result = await runWeeklyReviewForUser(admin, profile.id);
      results.push({ userId: profile.id, ...result });
    }

    return NextResponse.json({ ok: true, users: results.length, results });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Weekly review cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
