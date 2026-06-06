import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findBestPlanForDate,
  getTrainingPlanByWeekStart,
} from "@/lib/training/plan-server";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week_start");
  const listAll = searchParams.get("list") === "all";
  const forToday = searchParams.get("for_today") === "1";

  if (listAll) {
    const { data: plans, error } = await supabase
      .from("training_plans")
      .select("id, name, week_start, week_end, week_notes")
      .eq("user_id", user.id)
      .order("week_start", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ plans: plans ?? [] });
  }

  let targetWeekStart = weekStart;

  if (!targetWeekStart || forToday) {
    const today = format(new Date(), "yyyy-MM-dd");
    const plan = await findBestPlanForDate(supabase, user.id, today);
    targetWeekStart = plan?.week_start ?? weekStart ?? null;
  }

  if (!targetWeekStart) {
    return NextResponse.json({
      plan: null,
      workouts: [],
      completedActivities: [],
    });
  }

  const result = await getTrainingPlanByWeekStart(
    supabase,
    user.id,
    targetWeekStart
  );

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week_start");
  if (!weekStart) {
    return NextResponse.json({ error: "week_start required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("training_plans")
    .delete()
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
