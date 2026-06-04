/** Postgres date or timestamptz → yyyy-MM-dd */
export function normalizeWorkoutDate(date: string): string {
  if (!date) return "";
  return date.slice(0, 10);
}

/**
 * Garmin list API sometimes returns duration in minutes (< ~10h as number < 600).
 * Values clearly in seconds (e.g. > 600) are kept as-is.
 */
export function garminDurationToSeconds(
  duration: number | undefined,
  elapsedDuration: number | undefined,
  movingDuration?: number | undefined
): number {
  const candidates = [duration, elapsedDuration, movingDuration].filter(
    (v): v is number => v != null && v > 0
  );
  if (candidates.length === 0) return 0;

  const raw = Math.max(...candidates);
  if (raw >= 600) return Math.round(raw);
  return Math.round(raw * 60);
}

export function effectiveDurationSec(
  durationSec: number | null | undefined,
  rawData: unknown
): number {
  if (durationSec != null && durationSec > 0) {
    return durationSec;
  }

  if (rawData && typeof rawData === "object") {
    const raw = rawData as Record<string, number | undefined>;
    return garminDurationToSeconds(
      raw.duration,
      raw.elapsedDuration,
      raw.movingDuration
    );
  }

  return 0;
}
