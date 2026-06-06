import { GarminConnect } from "garmin-connect";

type GarminClient = InstanceType<typeof GarminConnect>;

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

function isMultisportShell(activity: GarminActivity): boolean {
  const key = (activity.activityType?.typeKey ?? "").toLowerCase();
  if (activity.parent === true) return true;
  return key.includes("multi_sport") || key === "transition";
}

/**
 * Multisport-Parent nur weglassen, wenn die Kind-Aktivitäten schon in der Liste sind.
 * Niemals normale Aktivitäten verwerfen (früherer Bug: Parent ohne Kinder → komplett gelöscht).
 */
export async function expandMultisportActivities(
  _client: GarminClient,
  activities: GarminActivity[]
): Promise<GarminActivity[]> {
  const parentIdsWithChildrenInList = new Set(
    activities
      .map((a) => a.parentId)
      .filter((id): id is number => id != null && id > 0)
  );

  return activities.filter((activity) => {
    if (
      isMultisportShell(activity) &&
      parentIdsWithChildrenInList.has(activity.activityId)
    ) {
      return false;
    }
    return true;
  });
}
