import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/google/oauth";
import { resolveGoogleRedirectUri } from "@/lib/google/redirect-uri";
import { isGoogleCalendarConfigured } from "@/lib/integrations/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar env vars missing" },
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

  const state = Buffer.from(
    JSON.stringify({ userId: user.id })
  ).toString("base64url");

  const redirectUri = resolveGoogleRedirectUri(request);
  const url = getGoogleAuthUrl(state, redirectUri);
  return NextResponse.redirect(url);
}
