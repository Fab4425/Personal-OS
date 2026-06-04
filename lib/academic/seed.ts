import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ACADEMIC_SUBJECTS } from "@/lib/academic/subjects";

export async function ensureAcademicSubjects(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("academic_subjects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  const rows = DEFAULT_ACADEMIC_SUBJECTS.map((name, index) => ({
    user_id: userId,
    name,
    sort_order: index,
  }));

  const { error } = await supabase.from("academic_subjects").insert(rows);
  if (error) throw error;
}
