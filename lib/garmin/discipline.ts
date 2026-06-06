import type { Database } from "@/lib/supabase/database.types";

type Discipline = Database["public"]["Tables"]["workouts"]["Row"]["discipline"];

export function mapGarminActivityToDiscipline(
  typeKey: string,
  activityName: string
): Discipline {
  const key = typeKey.toLowerCase();
  const name = activityName.toLowerCase();

  if (
    key.includes("swim") ||
    key === "lap_swimming" ||
    key === "open_water_swimming"
  ) {
    return "swim";
  }
  if (
    key.includes("cycle") ||
    key.includes("bike") ||
    key === "virtual_ride" ||
    key === "indoor_cycling"
  ) {
    return "bike";
  }
  if (
    key.includes("run") ||
    key === "trail_running" ||
    key === "treadmill_running"
  ) {
    return "run";
  }
  if (
    name.includes("wettkampf") ||
    name.includes("race") ||
    name.includes("brick") ||
    name.includes("triathlon") ||
    key.includes("race") ||
    key.includes("multi_sport") ||
    key === "transition"
  ) {
    return "race";
  }
  if (
    key.includes("strength") ||
    key.includes("gym") ||
    key === "fitness_equipment"
  ) {
    return "gym";
  }
  return "run";
}
