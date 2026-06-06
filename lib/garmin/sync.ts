import { subDays, format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getGarminClient } from "@/lib/garmin/client";
import { mapGarminActivityToDiscipline } from "@/lib/garmin/discipline";
import { parseGarminActivityDate } from "@/lib/garmin/activity-date";
import { expandMultisportActivities } from "@/lib/garmin/multisport";
import { upsertGarminWorkout } from "@/lib/garmin/workout-store";
import { garminDurationToSeconds } from "@/lib/training/normalize";
import { syncAllPlanStatusesForUser } from "@/lib/training/plan-match";
import { isGarminConfigured } from "@/lib/integrations/config";

interface GarminActivity {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  activityType?: { typeKey: string };
  duration: number;
  elapsedDuration: number;
  distance: number;
  averageHR?: number;
  maxHR?: number;
  calories?: number;
  avgPower?: number;
  parent?: boolean;
  parentId?: number | null;
  movingDuration?: number;
}

export interface GarminSyncResult {
  workoutsUpserted: number;
  healthDaysUpserted: number;
  activitiesFetched: number;
  workoutErrors: string[];
}

function mapSleepQuality(overallScore: number | undefined): number | null {
  if (overallScore === undefined || Number.isNaN(overallScore)) return null;
  if (overallScore >= 80) return 5;
  if (overallScore >= 60) return 4;
  if (overallScore >= 40) return 3;
  if (overallScore >= 20) return 2;
  return 1;
}

function buildWorkoutPayload(
  userId: string,
  activity: GarminActivity
): Parameters<typeof upsertGarminWorkout>[1] {
  const dateStr = parseGarminActivityDate(activity.startTimeLocal);
  const discipline = mapGarminActivityToDiscipline(
    activity.activityType?.typeKey ?? "other",
    activity.activityName ?? ""
  );
  const durationSec = garminDurationToSeconds(
    activity.duration,
    activity.elapsedDuration,
    activity.movingDuration
  );
  const distanceM =
    activity.distance != null ? Math.round(activity.distance) : null;

  return {
    user_id: userId,
    source: "garmin",
    external_id: String(activity.activityId),
    discipline,
    date: dateStr,
    duration_sec: durationSec > 0 ? durationSec : null,
    distance_m: distanceM,
    avg_hr: activity.averageHR ? Math.round(activity.averageHR) : null,
    max_hr: activity.maxHR ? Math.round(activity.maxHR) : null,
    calories: activity.calories ? Math.round(activity.calories) : null,
    normalized_power:
      typeof activity.avgPower === "number" ? activity.avgPower : null,
    raw_data: activity as unknown as Record<string, unknown>,
  };
}

async function rematchGarminDisciplinesFromRaw(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: rows } = await supabase
    .from("workouts")
    .select("id, discipline, raw_data")
    .eq("user_id", userId)
    .eq("source", "garmin");

  for (const row of rows ?? []) {
    const raw = row.raw_data as {
      activityType?: { typeKey?: string };
      activityName?: string;
    } | null;
    const typeKey = raw?.activityType?.typeKey;
    if (!typeKey) continue;

    const mapped = mapGarminActivityToDiscipline(
      typeKey,
      raw?.activityName ?? ""
    );
    if (mapped !== row.discipline) {
      await supabase
        .from("workouts")
        .update({ discipline: mapped })
        .eq("id", row.id);
    }
  }
}

export async function syncGarminForUser(
  supabase: SupabaseClient,
  userId: string,
  daysBack = 56
): Promise<GarminSyncResult> {
  if (!isGarminConfigured()) {
    throw new Error("Garmin ist nicht konfiguriert");
  }

  const client = await getGarminClient();
  const limit = 100;
  const rawActivities = (await client.getActivities(
    0,
    limit
  )) as GarminActivity[];
  const activities = await expandMultisportActivities(client, rawActivities);

  let workoutsUpserted = 0;
  const workoutErrors: string[] = [];
  const cutoff = subDays(new Date(), daysBack);

  for (const activity of activities) {
    const dateStr = parseGarminActivityDate(activity.startTimeLocal);
    if (new Date(dateStr) < cutoff) continue;

    const payload = buildWorkoutPayload(userId, activity);
    const { ok, error } = await upsertGarminWorkout(supabase, payload);

    if (ok) {
      workoutsUpserted += 1;
    } else if (error) {
      workoutErrors.push(
        `${activity.activityName ?? activity.activityId}: ${error}`
      );
    }
  }

  let healthDaysUpserted = 0;
  for (let i = 0; i < daysBack; i++) {
    const day = subDays(new Date(), i);
    const dateStr = format(day, "yyyy-MM-dd");

    try {
      const sleep = await client.getSleepData(day);
      const dto = sleep.dailySleepDTO;
      const sleepHours =
        dto?.sleepTimeSeconds != null
          ? Math.round((dto.sleepTimeSeconds / 3600) * 10) / 10
          : null;
      const sleepQuality = mapSleepQuality(
        dto?.sleepScores?.overall?.value
      );
      const lastBodyBattery =
        sleep.sleepBodyBattery?.length > 0
          ? sleep.sleepBodyBattery[sleep.sleepBodyBattery.length - 1].value
          : null;

      const { error } = await supabase.from("daily_health").upsert(
        {
          user_id: userId,
          date: dateStr,
          resting_hr: sleep.restingHeartRate
            ? Math.round(sleep.restingHeartRate)
            : null,
          hrv_score: sleep.avgOvernightHrv ?? null,
          sleep_hours: sleepHours,
          sleep_quality: sleepQuality,
          body_battery: lastBodyBattery,
          stress_score: dto?.avgSleepStress
            ? Math.round(dto.avgSleepStress)
            : null,
        },
        { onConflict: "user_id,date" }
      );

      if (!error) healthDaysUpserted += 1;
    } catch {
      // Kein Schlafdatensatz für diesen Tag
    }
  }

  await supabase.from("connected_accounts").upsert(
    {
      user_id: userId,
      provider: "garmin",
      access_token: "env",
      last_sync_at: new Date().toISOString(),
      metadata: { via: "garmin-connect", daysBack },
    },
    { onConflict: "user_id,provider" }
  );

  await rematchGarminDisciplinesFromRaw(supabase, userId);
  await syncAllPlanStatusesForUser(supabase, userId);

  return {
    workoutsUpserted,
    healthDaysUpserted,
    activitiesFetched: rawActivities.length,
    workoutErrors: workoutErrors.slice(0, 5),
  };
}
