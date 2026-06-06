import { createClient } from "@supabase/supabase-js";
import pkg from "garmin-connect";
const { GarminConnect } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.GARMIN_EMAIL;
const password = process.env.GARMIN_PASSWORD;

if (!url || !key || !email || !password) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key);
const tokenDir = path.join(root, ".garmin-tokens");
const client = new GarminConnect({ username: email, password });

if (
  fs.existsSync(path.join(tokenDir, "oauth1_token.json")) &&
  fs.existsSync(path.join(tokenDir, "oauth2_token.json"))
) {
  client.loadTokenByFile(tokenDir);
} else {
  await client.login(email, password);
}

const activities = await client.getActivities(0, 10);
console.log("Garmin activities (last 10):", activities.length);
for (const a of activities.slice(0, 5)) {
  console.log({
    id: a.activityId,
    name: a.activityName,
    date: a.startTimeLocal,
    type: a.activityType?.typeKey,
    parent: a.parent,
    parentId: a.parentId,
  });
}

const { data: profiles } = await supabase.from("profiles").select("id, email");
console.log("Profiles:", profiles?.length ?? 0);

if (profiles?.[0]) {
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("id, date, discipline, source, external_id, duration_sec")
    .eq("user_id", profiles[0].id)
    .order("date", { ascending: false })
    .limit(10);
  console.log("DB workouts error:", error?.message ?? "none");
  console.log("DB workouts:", workouts?.length ?? 0, workouts);
}

// Test insert ohne external_id (Fallback wie im App-Code)
if (profiles?.[0] && activities[0]) {
  const a = activities[0];
  const date = String(a.startTimeLocal).includes("T")
    ? String(a.startTimeLocal).split("T")[0]
    : String(a.startTimeLocal).split(" ")[0];
  const test = {
    user_id: profiles[0].id,
    source: "garmin",
    discipline: "run",
    date,
    duration_sec: 60,
    raw_data: { activityId: a.activityId },
  };
  const { data: inserted, error } = await supabase
    .from("workouts")
    .insert(test)
    .select("id");
  console.log("Test insert (ohne external_id):", error?.message ?? "ok");
  if (inserted?.[0]?.id) {
    await supabase.from("workouts").delete().eq("id", inserted[0].id);
  }
}
