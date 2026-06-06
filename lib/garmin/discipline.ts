import type { Database } from "@/lib/supabase/database.types";

type Discipline = Database["public"]["Tables"]["workouts"]["Row"]["discipline"];

/** Garmin activityType.typeKey → Disziplin (exakte Treffer zuerst) */
const GARMIN_TYPE_MAP: Record<string, Discipline> = {
  running: "run",
  trail_running: "run",
  treadmill_running: "run",
  indoor_running: "run",
  street_running: "run",
  virtual_run: "run",
  cycling: "bike",
  indoor_cycling: "bike",
  virtual_ride: "bike",
  e_bike_fitness: "bike",
  e_bike_mountain: "bike",
  mountain_biking: "bike",
  road_biking: "bike",
  gravel_cycling: "bike",
  lap_swimming: "swim",
  open_water_swimming: "swim",
  swimming: "swim",
  pool_swimming: "swim",
  strength_training: "gym",
  fitness_equipment: "gym",
  cardio_training: "gym",
  yoga: "gym",
  pilates: "gym",
  indoor_cardio: "gym",
  hiit: "gym",
  multi_sport: "race",
  transition: "race",
  triathlon: "race",
};

export function mapGarminActivityToDiscipline(
  typeKey: string,
  activityName: string
): Discipline {
  const key = typeKey.trim().toLowerCase();
  const name = activityName.toLowerCase();

  if (key && GARMIN_TYPE_MAP[key]) {
    return GARMIN_TYPE_MAP[key];
  }

  if (
    key.includes("swim") ||
    key.includes("pool") && key.includes("swim")
  ) {
    return "swim";
  }
  if (
    key.includes("cycl") ||
    key.includes("bik") ||
    key.includes("ride")
  ) {
    return "bike";
  }
  if (key.includes("run") || key.includes("jog")) {
    return "run";
  }
  if (
    key.includes("strength") ||
    key.includes("gym") ||
    key.includes("fitness") ||
    key.includes("cardio") ||
    key.includes("yoga") ||
    key.includes("hiit")
  ) {
    return "gym";
  }
  if (
    key.includes("multi_sport") ||
    key.includes("triathlon") ||
    key === "transition"
  ) {
    return "race";
  }

  if (
    name.includes("schwimm") ||
    name.includes("swim")
  ) {
    return "swim";
  }
  if (
    name.includes("rad") ||
    name.includes("bike") ||
    name.includes("cycl") ||
    name.includes("fahrrad")
  ) {
    return "bike";
  }
  if (
    name.includes("lauf") ||
    name.includes("run") ||
    name.includes("jog")
  ) {
    return "run";
  }
  if (
    name.includes("kraft") ||
    name.includes("strength") ||
    name.includes("gym") ||
    name.includes("hiit")
  ) {
    return "gym";
  }
  if (
    name.includes("wettkampf") ||
    name.includes("brick") ||
    name.includes("triathlon")
  ) {
    return "race";
  }
  if (name.includes("race") && !name.includes("radfahr")) {
    return "race";
  }

  return "run";
}
