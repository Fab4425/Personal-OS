import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("academic_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    subject: string;
    type: string;
    grade: number;
    max_grade?: number;
    date?: string;
    semester?: string;
  };

  const { data, error } = await supabase
    .from("academic_records")
    .insert({
      user_id: user.id,
      subject: body.subject,
      type: body.type,
      grade: body.grade,
      max_grade: body.max_grade ?? 100,
      date: body.date ?? null,
      semester: body.semester ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
