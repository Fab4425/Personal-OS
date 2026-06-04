import { google } from "googleapis";
import { isGoogleCalendarConfigured } from "@/lib/integrations/config";
import { resolveGoogleRedirectUri } from "@/lib/google/redirect-uri";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export function createOAuth2Client(redirectUri?: string) {
  if (!isGoogleCalendarConfigured()) {
    throw new Error("Google Calendar ist nicht konfiguriert");
  }

  const uri = redirectUri ?? resolveGoogleRedirectUri();

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    uri
  );
}

export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const client = createOAuth2Client(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
    redirect_uri: redirectUri,
  });
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const client = createOAuth2Client(redirectUri);
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  return tokens;
}

export function oauthClientFromTokens(
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  },
  redirectUri?: string
) {
  const client = createOAuth2Client(redirectUri);
  client.setCredentials({
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  });
  return client;
}
