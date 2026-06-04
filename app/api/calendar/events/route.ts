import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id: string;
    start_at?: string;
    end_at?: string;
    title?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    local_changes: {
      dirty: true,
      updatedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };
  if (body.start_at) updates.start_at = body.start_at;
  if (body.end_at) updates.end_at = body.end_at;
  if (body.title) updates.title = body.title;

  const { error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title: string;
    start_at: string;
    end_at: string;
    type?: string;
  };

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: body.title,
      start_at: body.start_at,
      end_at: body.end_at,
      type: body.type ?? "personal",
      local_changes: { dirty: true, updatedAt: new Date().toISOString() },
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
