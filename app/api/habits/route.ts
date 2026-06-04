import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true);

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, completed")
    .eq("user_id", user.id)
    .eq("date", today);

  return NextResponse.json({ habits: habits ?? [], logs: logs ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { name: string; icon?: string };

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name: body.name,
      icon: body.icon ?? "✓",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habit: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { habit_id: string; completed: boolean };
  const today = format(new Date(), "yyyy-MM-dd");

  const { error } = await supabase.from("habit_logs").upsert(
    {
      habit_id: body.habit_id,
      user_id: user.id,
      date: today,
      completed: body.completed,
    },
    { onConflict: "habit_id,date" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
