/**
 * TSVE 6-Wochen-Plan für alle User oder einen User importieren.
 * node scripts/import-triathlon-plans.mjs
 * node scripts/import-triathlon-plans.mjs --email=deine@mail.de
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY nötig");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false },
});

const FILES = [
  "woche-1.json",
  "woche-2.json",
  "woche-3.json",
  "woche-4.json",
  "woche-5.json",
  "woche-6.json",
];

// Inline minimal import (same logic as plan-import.ts)
function parsePlan(data) {
  if (!data?.plan_name || !data?.week_start || !Array.isArray(data.workouts)) {
    throw new Error("Ungültiges Plan-JSON");
  }
  return data;
}

function weekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

async function importPlan(userId, json, filename) {
  const plan = parsePlan(json);
  const weekEndStr = weekEnd(plan.week_start);

  const { data: existing } = await admin
    .from("training_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", plan.week_start)
    .maybeSingle();

  if (existing) {
    await admin.from("training_plans").delete().eq("id", existing.id);
  }

  const { data: inserted, error: planErr } = await admin
    .from("training_plans")
    .insert({
      user_id: userId,
      name: plan.plan_name,
      week_start: plan.week_start,
      week_end: weekEndStr,
      week_notes: plan.week_notes ?? null,
      source_filename: filename,
      raw_json: json,
    })
    .select("id")
    .single();

  if (planErr) throw planErr;

  const rows = plan.workouts.map((w, i) => ({
    plan_id: inserted.id,
    user_id: userId,
    date: w.date,
    discipline: w.discipline,
    title: w.title,
    description: w.description ?? null,
    duration_min: w.duration_min ?? null,
    distance_m: w.distance_km != null ? Math.round(w.distance_km * 1000) : w.distance_m ?? null,
    target_tss: w.target_tss ?? null,
    intensity: w.intensity ?? null,
    structure: w.structure ?? [],
    sort_order: i,
    status: "planned",
  }));

  const { error: wErr } = await admin.from("planned_workouts").insert(rows);
  if (wErr) {
    await admin.from("training_plans").delete().eq("id", inserted.id);
    throw wErr;
  }

  return { name: plan.plan_name, week: plan.week_start, count: rows.length };
}

async function main() {
  const emailArg = process.argv.find((a) => a.startsWith("--email="));
  const email = emailArg?.split("=")[1];

  let userId;
  if (email) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .limit(1);
    userId = profiles?.[0]?.id;
    if (!userId) {
      console.error("Kein Profil für", email);
      process.exit(1);
    }
  } else {
    const { data: profiles } = await admin.from("profiles").select("id, email");
    if (!profiles?.length) {
      console.error("Keine Profile in der DB");
      process.exit(1);
    }
    if (profiles.length > 1) {
      console.error(
        "Mehrere User — bitte: node scripts/import-triathlon-plans.mjs --email=DEINE@MAIL.de"
      );
      process.exit(1);
    }
    userId = profiles[0].id;
    console.log("User:", profiles[0].email ?? userId);
  }

  const baseDir = path.join(root, "public", "examples", "triathlon-tsve-6wochen");

  for (const file of FILES) {
    const json = JSON.parse(
      readFileSync(path.join(baseDir, file), "utf-8")
    );
    const r = await importPlan(userId, json, file);
    console.log(`OK ${file}: ${r.name} (${r.count} Einheiten)`);
  }

  console.log("\nFertig — 6 Wochen importiert.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
