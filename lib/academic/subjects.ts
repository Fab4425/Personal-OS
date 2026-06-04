/** Standard-Fächer (Reihenfolge für die Tabelle) */
export const DEFAULT_ACADEMIC_SUBJECTS = [
  "Mathe",
  "Deutsch",
  "Englisch",
  "Latein",
  "Chemie",
  "Physik",
  "Biologie",
  "Kunst",
  "Geschichte",
  "Politik",
  "Informatik",
  "Erdkunde",
] as const;

export interface AcademicSubjectRow {
  id: string;
  name: string;
  sort_order: number;
  oral_grade: number | null;
  written_grade: number | null;
}

export interface GradeHistoryPoint {
  date: string;
  average_grade: number;
  subjects_count: number;
}
