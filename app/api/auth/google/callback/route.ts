import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeGoogleCode } from "@/lib/google/oauth";
import { resolveGoogleRedirectUri } from "@/lib/google/redirect-uri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?google=error&reason=${error}`, request.url)
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/settings?google=error&reason=missing_code", request.url)
    );
  }

  let userId: string;
  try {
    const parsed = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8")
    ) as { userId: string };
    userId = parsed.userId;
  } catch {
    return NextResponse.redirect(
      new URL("/settings?google=error&reason=invalid_state", request.url)
    );
  }

  try {
    const redirectUri = resolveGoogleRedirectUri(request);
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const admin = createAdminClient();

    await admin.from("connected_accounts").upsert(
      {
        user_id: userId,
        provider: "google",
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        last_sync_at: null,
        metadata: { scope: "calendar" },
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.redirect(
      new URL("/settings?google=connected", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/settings?google=error&reason=token_exchange", request.url)
    );
  }
}
