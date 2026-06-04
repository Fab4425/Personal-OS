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
  const { data } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  return NextResponse.json({ plan: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    top_3_goals?: string[];
    notes?: string;
    mood_score?: number;
    time_blocks?: unknown[];
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("daily_plans")
    .upsert(
      {
        user_id: user.id,
        date: today,
        top_3_goals: body.top_3_goals ?? [],
        notes: body.notes ?? null,
        mood_score: body.mood_score ?? null,
        time_blocks: body.time_blocks ?? [],
      },
      { onConflict: "user_id,date" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plan: data });
}
