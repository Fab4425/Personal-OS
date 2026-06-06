export interface PlannedWorkoutView {
  id: string;
  date: string;
  discipline: string;
  title: string;
  description: string | null;
  duration_min: number | null;
  distance_m: number | null;
  target_tss: number | null;
  intensity: string | null;
  structure: unknown;
  status: string;
}

export interface TrainingPlanView {
  id: string;
  name: string;
  week_start: string;
  week_end: string;
  week_notes: string | null;
}

export interface CompletedActivityView {
  id: string;
  date: string;
  discipline: string;
  source: string;
  duration_sec: number;
  distance_m: number | null;
  name: string | null;
}
