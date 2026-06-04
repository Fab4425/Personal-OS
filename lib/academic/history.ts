import { format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  classAverage,
  countGradedSubjects,
} from "@/lib/academic/grades";
import type { AcademicSubjectRow } from "@/lib/academic/subjects";

export async function recordGradeSnapshot(
  supabase: SupabaseClient,
  userId: string,
  subjects: AcademicSubjectRow[]
): Promise<void> {
  const avg = classAverage(subjects);
  if (avg == null) return;

  const today = format(new Date(), "yyyy-MM-dd");
  const count = countGradedSubjects(subjects);

  await supabase.from("academic_grade_history").upsert(
    {
      user_id: userId,
      date: today,
      average_grade: avg,
      subjects_count: count,
    },
    { onConflict: "user_id,date" }
  );
}
