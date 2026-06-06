import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function shouldSkipSupabase(pathname: string, request: NextRequest): boolean {
  if (pathname.startsWith("/api/auth/google/callback")) {
    return true;
  }
  if (pathname.startsWith("/api/cron/")) {
    const cronSecret = process.env.CRON_SECRET;
    return (
      !!cronSecret &&
      request.headers.get("authorization") === `Bearer ${cronSecret}`
    );
  }
  if (pathname === "/api/calendar/sync") {
    const cronSecret = process.env.CRON_SECRET;
    return (
      !!cronSecret &&
      request.headers.get("authorization") === `Bearer ${cronSecret}`
    );
  }
  return false;
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
): void {
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) {
      response.cookies.delete(name);
    }
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldSkipSupabase(pathname, request)) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "middleware: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Parameters<typeof supabaseResponse.cookies.set>[2];
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("middleware: supabase.auth.getUser failed", error);
    clearSupabaseAuthCookies(request, supabaseResponse);
  }

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/callback");

  if (!user && !isAuthRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
