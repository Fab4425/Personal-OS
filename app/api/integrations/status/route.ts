import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isGarminConfigured,
  isGoogleCalendarConfigured,
  isStravaConfigured,
  getStravaUnavailableMessage,
} from "@/lib/integrations/config";
import { resolveGoogleRedirectUri } from "@/lib/google/redirect-uri";
import { getGarminTokenDir } from "@/lib/garmin/client";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: accounts } = await supabase
    .from("connected_accounts")
    .select("provider, last_sync_at")
    .eq("user_id", user.id);

  const byProvider = Object.fromEntries(
    (accounts ?? []).map((a) => [a.provider, a.last_sync_at])
  );

  const tokenDir = getGarminTokenDir();
  const garminTokensSaved =
    fs.existsSync(path.join(tokenDir, "oauth1_token.json")) &&
    fs.existsSync(path.join(tokenDir, "oauth2_token.json"));

  return NextResponse.json({
    garmin: {
      configured: isGarminConfigured(),
      connected: Boolean(byProvider.garmin),
      lastSync: byProvider.garmin ?? null,
      tokensSaved: garminTokensSaved,
      tokenPath: tokenDir,
    },
    google: {
      configured: isGoogleCalendarConfigured(),
      connected: Boolean(byProvider.google),
      lastSync: byProvider.google ?? null,
      redirectUri: resolveGoogleRedirectUri(request),
    },
    strava: {
      configured: isStravaConfigured(),
      connected: Boolean(byProvider.strava),
      lastSync: byProvider.strava ?? null,
      note: isStravaConfigured() ? null : getStravaUnavailableMessage(),
    },
  });
}
