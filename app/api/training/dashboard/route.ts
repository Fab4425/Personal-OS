import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrainingDashboard } from "@/lib/training/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = new URL(request.url).searchParams.get("week");

  try {
    const data = await getTrainingDashboard(supabase, user.id, week);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
