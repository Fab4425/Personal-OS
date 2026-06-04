import { subDays, format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
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
}
import { getGarminClient } from "@/lib/garmin/client";
import { mapGarminActivityToDiscipline } from "@/lib/garmin/discipline";
import { garminDurationToSeconds } from "@/lib/training/normalize";
import { isGarminConfigured } from "@/lib/integrations/config";

export interface GarminSyncResult {
  workoutsUpserted: number;
  healthDaysUpserted: number;
  activitiesFetched: number;
}

function activityDate(activity: GarminActivity): string {
  return activity.startTimeLocal.split("T")[0] ?? format(new Date(), "yyyy-MM-dd");
}

function mapSleepQuality(overallScore: number | undefined): number | null {
  if (overallScore === undefined || Number.isNaN(overallScore)) return null;
  if (overallScore >= 80) return 5;
  if (overallScore >= 60) return 4;
  if (overallScore >= 40) return 3;
  if (overallScore >= 20) return 2;
  return 1;
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
  const activities = await client.getActivities(0, limit);

  let workoutsUpserted = 0;
  const cutoff = subDays(new Date(), daysBack);

  for (const activity of activities as GarminActivity[]) {
    const dateStr = activityDate(activity);
    if (new Date(dateStr) < cutoff) continue;

    const externalId = String(activity.activityId);
    const discipline = mapGarminActivityToDiscipline(
      activity.activityType?.typeKey ?? "other",
      activity.activityName ?? ""
    );

    const durationSec = garminDurationToSeconds(
      activity.duration,
      activity.elapsedDuration,
      (activity as GarminActivity & { movingDuration?: number }).movingDuration
    );
    const distanceM =
      activity.distance != null ? Math.round(activity.distance) : null;

    const { error } = await supabase.from("workouts").upsert(
      {
        user_id: userId,
        source: "garmin",
        external_id: externalId,
        discipline,
        date: dateStr,
        duration_sec: durationSec > 0 ? durationSec : null,
        distance_m: distanceM,
        avg_hr: activity.averageHR ? Math.round(activity.averageHR) : null,
        max_hr: activity.maxHR ? Math.round(activity.maxHR) : null,
        calories: activity.calories ? Math.round(activity.calories) : null,
        normalized_power:
          typeof activity.avgPower === "number"
            ? activity.avgPower
            : null,
        raw_data: activity as unknown as Record<string, unknown>,
      },
      { onConflict: "user_id,source,external_id" }
    );

    if (!error) workoutsUpserted += 1;
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

  return {
    workoutsUpserted,
    healthDaysUpserted,
    activitiesFetched: activities.length,
  };
}
