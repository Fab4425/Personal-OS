import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseGradeInput } from "@/lib/academic/grades";
import { recordGradeSnapshot } from "@/lib/academic/history";
import { ensureAcademicSubjects } from "@/lib/academic/seed";
import type { AcademicSubjectRow } from "@/lib/academic/subjects";

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
    oral_grade?: string | number | null;
    written_grade?: string | number | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, number | null> = {};

  if (body.oral_grade !== undefined) {
    if (body.oral_grade === null || body.oral_grade === "") {
      updates.oral_grade = null;
    } else {
      const parsed =
        typeof body.oral_grade === "number"
          ? body.oral_grade
          : parseGradeInput(String(body.oral_grade));
      if (parsed == null) {
        return NextResponse.json(
          { error: "Mündliche Note muss zwischen 1 und 6 liegen" },
          { status: 400 }
        );
      }
      updates.oral_grade = parsed;
    }
  }

  if (body.written_grade !== undefined) {
    if (body.written_grade === null || body.written_grade === "") {
      updates.written_grade = null;
    } else {
      const parsed =
        typeof body.written_grade === "number"
          ? body.written_grade
          : parseGradeInput(String(body.written_grade));
      if (parsed == null) {
        return NextResponse.json(
          { error: "Schriftliche Note muss zwischen 1 und 6 liegen" },
          { status: 400 }
        );
      }
      updates.written_grade = parsed;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("academic_subjects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: allSubjects } = await supabase
    .from("academic_subjects")
    .select("id, name, sort_order, oral_grade, written_grade")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  await recordGradeSnapshot(
    supabase,
    user.id,
    (allSubjects ?? []) as AcademicSubjectRow[]
  );

  return NextResponse.json({ subject: updated });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAcademicSubjects(supabase, user.id);

  const [{ data: subjects }, { data: history }] = await Promise.all([
    supabase
      .from("academic_subjects")
      .select("id, name, sort_order, oral_grade, written_grade")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("academic_grade_history")
      .select("date, average_grade, subjects_count")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
  ]);

  return NextResponse.json({ subjects, history });
}
