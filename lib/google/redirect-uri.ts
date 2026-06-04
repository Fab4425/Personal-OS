/**
 * Redirect URI must match Google Cloud Console exactly (no trailing slash).
 * Prefer request origin in OAuth routes so .env typos cannot cause mismatch.
 */
export function resolveGoogleRedirectUri(request?: Request): string {
  if (request) {
    const origin = new URL(request.url).origin;
    return `${origin}/api/auth/google/callback`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (siteUrl) {
    return `${siteUrl}/api/auth/google/callback`;
  }

  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  return "http://localhost:3000/api/auth/google/callback";
}
