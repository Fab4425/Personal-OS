import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncPlannedWorkoutStatus } from "@/lib/training/plan-match";

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

  let planQuery = supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false });

  if (weekStart) {
    planQuery = planQuery.eq("week_start", weekStart);
  } else {
    planQuery = planQuery.limit(1);
  }

  const { data: plan, error: planError } = await planQuery.maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ plan: null, workouts: [] });
  }

  await syncPlannedWorkoutStatus(supabase, user.id, plan.id);

  const { data: workouts, error: wError } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("plan_id", plan.id)
    .order("date")
    .order("sort_order");

  if (wError) {
    return NextResponse.json({ error: wError.message }, { status: 500 });
  }

  return NextResponse.json({ plan, workouts: workouts ?? [] });
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
