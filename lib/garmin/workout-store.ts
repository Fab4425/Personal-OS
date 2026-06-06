import type { SupabaseClient } from "@supabase/supabase-js";

export interface GarminWorkoutPayload {
  user_id: string;
  source: "garmin";
  external_id: string;
  discipline: string;
  date: string;
  duration_sec: number | null;
  distance_m: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  calories: number | null;
  normalized_power: number | null;
  raw_data: Record<string, unknown>;
}

/**
 * PostgREST upsert onConflict fails on partial unique indexes — explicit update/insert.
 */
export async function upsertGarminWorkout(
  supabase: SupabaseClient,
  payload: GarminWorkoutPayload
): Promise<{ ok: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", payload.user_id)
    .eq("source", "garmin")
    .eq("external_id", payload.external_id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("workouts")
      .update({
        discipline: payload.discipline,
        date: payload.date,
        duration_sec: payload.duration_sec,
        distance_m: payload.distance_m,
        avg_hr: payload.avg_hr,
        max_hr: payload.max_hr,
        calories: payload.calories,
        normalized_power: payload.normalized_power,
        raw_data: payload.raw_data,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await supabase.from("workouts").insert(payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
