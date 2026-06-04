import { readFile } from "fs/promises";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { importTrainingPlanJson } from "@/lib/training/plan-import";

export const TSVE_PLAN_FILES = [
  "woche-1.json",
  "woche-2.json",
  "woche-3.json",
  "woche-4.json",
  "woche-5.json",
  "woche-6.json",
] as const;

export async function importTsveSixWeekPlans(
  supabase: SupabaseClient,
  userId: string
): Promise<
  Array<{
    planName: string;
    weekStart: string;
    workoutsImported: number;
  }>
> {
  const baseDir = path.join(
    process.cwd(),
    "public",
    "examples",
    "triathlon-tsve-6wochen"
  );

  const results = [];

  for (const file of TSVE_PLAN_FILES) {
    const raw = await readFile(path.join(baseDir, file), "utf-8");
    const json = JSON.parse(raw) as unknown;
    const result = await importTrainingPlanJson(
      supabase,
      userId,
      json,
      file
    );
    results.push({
      planName: result.planName,
      weekStart: result.weekStart,
      workoutsImported: result.workoutsImported,
    });
  }

  return results;
}
