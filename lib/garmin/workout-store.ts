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

function isExternalIdSchemaError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("external_id") || m.includes("schema cache");
}

function garminActivityIdFromRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.activityId ?? r.garmin_activity_id;
  if (id == null) return null;
  return String(id);
}

function workoutUpdateFields(payload: GarminWorkoutPayload) {
  return {
    discipline: payload.discipline,
    date: payload.date,
    duration_sec: payload.duration_sec,
    distance_m: payload.distance_m,
    avg_hr: payload.avg_hr,
    max_hr: payload.max_hr,
    calories: payload.calories,
    normalized_power: payload.normalized_power,
    raw_data: payload.raw_data,
  };
}

async function upsertWithExternalId(
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
      .update(workoutUpdateFields(payload))
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await supabase.from("workouts").insert(payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function upsertWithoutExternalId(
  supabase: SupabaseClient,
  payload: GarminWorkoutPayload
): Promise<{ ok: boolean; error?: string }> {
  const { external_id: _omit, ...row } = payload;

  const { data: sameDay, error: listError } = await supabase
    .from("workouts")
    .select("id, raw_data")
    .eq("user_id", payload.user_id)
    .eq("source", "garmin")
    .eq("date", payload.date);

  if (listError) return { ok: false, error: listError.message };

  const existing = (sameDay ?? []).find(
    (w) => garminActivityIdFromRaw(w.raw_data) === payload.external_id
  );

  if (existing?.id) {
    const { error } = await supabase
      .from("workouts")
      .update(workoutUpdateFields(payload))
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await supabase.from("workouts").insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * PostgREST upsert onConflict fails on partial unique indexes.
 * Falls back when phase2 migration (external_id) is not applied yet.
 */
export async function upsertGarminWorkout(
  supabase: SupabaseClient,
  payload: GarminWorkoutPayload
): Promise<{ ok: boolean; error?: string }> {
  const withExternal = await upsertWithExternalId(supabase, payload);
  if (withExternal.ok) return withExternal;

  if (!isExternalIdSchemaError(withExternal.error)) {
    return withExternal;
  }

  return upsertWithoutExternalId(supabase, payload);
}
