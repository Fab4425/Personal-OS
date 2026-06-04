import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runWeeklyReviewForUser } from "@/lib/weekly-review/run";
import { getWeekStart } from "@/lib/weekly-review/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getWeekStart();

  const { data: current } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  const { data: recent } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(8);

  return NextResponse.json({ current, recent: recent ?? [] });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userName =
    user.user_metadata?.full_name?.toString() ??
    user.email?.split("@")[0] ??
    "Athlet";

  const result = await runWeeklyReviewForUser(supabase, user.id, {
    userName,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const { data: review } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", result.weekStart)
    .single();

  return NextResponse.json({ review });
}
