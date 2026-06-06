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

export async function expandMultisportActivities(
  client: GarminClient,
  activities: GarminActivity[]
): Promise<GarminActivity[]> {
  const childIdsInList = new Set(
    activities
      .map((a) => a.parentId)
      .filter((id): id is number => id != null && id > 0)
  );

  const result: GarminActivity[] = [];

  for (const activity of activities) {
    if (isMultisportShell(activity)) {
      if (childIdsInList.has(activity.activityId)) continue;

      try {
        const details = (await client.getActivity({
          activityId: activity.activityId,
        })) as GarminActivity & {
          metadataDTO?: { childIds?: (number | null)[] | null };
        };
        const childIds = details.metadataDTO?.childIds?.filter(
          (id): id is number => id != null && id > 0
        );
        if (childIds?.length) {
          for (const childId of childIds) {
            try {
              const child = (await client.getActivity({
                activityId: childId,
              })) as GarminActivity;
              result.push(child);
            } catch {
              // Einzelnes Kind überspringen
            }
          }
          continue;
        }
      } catch {
        // Details nicht verfügbar — Parent als Fallback behalten
      }
    }

    if (activity.parentId != null && activity.parentId > 0) {
      result.push(activity);
      continue;
    }

    if (!isMultisportShell(activity)) {
      result.push(activity);
    }
  }

  return result;
}
