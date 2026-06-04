import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isStravaConfigured,
  getStravaUnavailableMessage,
} from "@/lib/integrations/config";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStravaConfigured()) {
    return NextResponse.json(
      {
        error: "strava_not_configured",
        message: getStravaUnavailableMessage(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Strava-Sync ist vorbereitet, aber noch nicht implementiert." },
    { status: 501 }
  );
}
