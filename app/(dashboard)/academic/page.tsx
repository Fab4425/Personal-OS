import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { AcademicGradesBoard } from "@/components/academic/AcademicGradesBoard";
import { recordGradeSnapshot } from "@/lib/academic/history";
import { ensureAcademicSubjects } from "@/lib/academic/seed";
import type {
  AcademicSubjectRow,
  GradeHistoryPoint,
} from "@/lib/academic/subjects";

export default async function AcademicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await ensureAcademicSubjects(supabase, user!.id);

  const [{ data: subjectsRaw }, { data: historyRaw }] = await Promise.all([
    supabase
      .from("academic_subjects")
      .select("id, name, sort_order, oral_grade, written_grade")
      .eq("user_id", user!.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("academic_grade_history")
      .select("date, average_grade, subjects_count")
      .eq("user_id", user!.id)
      .order("date", { ascending: true }),
  ]);

  const subjects: AcademicSubjectRow[] = (subjectsRaw ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    sort_order: s.sort_order,
    oral_grade: s.oral_grade != null ? Number(s.oral_grade) : null,
    written_grade: s.written_grade != null ? Number(s.written_grade) : null,
  }));

  const history: GradeHistoryPoint[] = (historyRaw ?? []).map((h) => ({
    date: String(h.date).slice(0, 10),
    average_grade: Number(h.average_grade),
    subjects_count: h.subjects_count,
  }));

  if (subjects.some((s) => s.oral_grade != null || s.written_grade != null)) {
    await recordGradeSnapshot(supabase, user!.id, subjects);
  }

  return (
    <PageShell
      title="Akademie"
      description="Noten · Durchschnitt · Verlauf"
      userEmail={user?.email}
      moduleName="Akademie"
    >
      <AcademicGradesBoard subjects={subjects} history={history} />
    </PageShell>
  );
}
