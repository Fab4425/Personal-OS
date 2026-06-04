import type { AcademicSubjectRow } from "@/lib/academic/subjects";

/** Gesamtnote pro Fach: Mittel aus mündlich + schriftlich, sonst die vorhandene Note */
export function subjectOverallGrade(
  oral: number | null | undefined,
  written: number | null | undefined
): number | null {
  const o = oral ?? null;
  const w = written ?? null;
  if (o != null && w != null) return roundGrade((o + w) / 2);
  if (o != null) return roundGrade(o);
  if (w != null) return roundGrade(w);
  return null;
}

export function roundGrade(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatGrade(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(2).replace(/\.?0+$/, "") || value.toFixed(1);
}

export function parseGradeInput(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (Number.isNaN(n) || n < 1 || n > 6) return null;
  return roundGrade(n);
}

/** Notendurchschnitt über alle Fächer mit mindestens einer Note */
export function classAverage(subjects: AcademicSubjectRow[]): number | null {
  const grades = subjects
    .map((s) => subjectOverallGrade(s.oral_grade, s.written_grade))
    .filter((g): g is number => g != null);
  if (grades.length === 0) return null;
  return roundGrade(grades.reduce((a, b) => a + b, 0) / grades.length);
}

export function countGradedSubjects(subjects: AcademicSubjectRow[]): number {
  return subjects.filter(
    (s) =>
      subjectOverallGrade(s.oral_grade, s.written_grade) != null
  ).length;
}
