import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCronRequest } from "@/lib/api/cron-auth";
import { syncCalendarForUser } from "@/lib/google/calendar-sync";
import { isGoogleCalendarConfigured } from "@/lib/integrations/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function syncAllGoogleUsers() {
  const admin = createAdminClient();
  const { data: accounts } = await admin
    .from("connected_accounts")
    .select("user_id")
    .eq("provider", "google")
    .not("refresh_token", "is", null);

  const results = [];
  for (const account of accounts ?? []) {
    try {
      const result = await syncCalendarForUser(admin, account.user_id);
      results.push({ userId: account.user_id, ...result });
    } catch (err) {
      results.push({
        userId: account.user_id,
        error: err instanceof Error ? err.message : "sync failed",
      });
    }
  }
  return results;
}

export async function GET(request: Request) {
  if (isValidCronRequest(request)) {
    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    try {
      const results = await syncAllGoogleUsers();
      return NextResponse.json({ ok: true, results });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cron calendar failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCalendarForUser(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCalendarForUser(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
