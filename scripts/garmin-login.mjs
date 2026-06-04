/**
 * One-time Garmin login (supports MFA in the terminal).
 * Saves tokens to .garmin-tokens/ — the app reuses them for sync.
 *
 * Usage: npm run garmin:login
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    process.env[key] = val;
  }
}

loadEnvLocal();

function readCredential(value) {
  if (!value) return undefined;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v.trim() || undefined;
}

const email = readCredential(process.env.GARMIN_EMAIL);
const password = readCredential(process.env.GARMIN_PASSWORD);
const tokenDir =
  process.env.GARMIN_TOKEN_PATH?.trim() ||
  path.join(root, ".garmin-tokens");
const domain =
  process.env.GARMIN_DOMAIN === "garmin.cn" ? "garmin.cn" : "garmin.com";

if (!email || !password) {
  console.error("GARMIN_EMAIL und GARMIN_PASSWORD in .env.local setzen.");
  process.exit(1);
}

const { GarminConnect } = require("garmin-connect");

const client = new GarminConnect({ username: email, password }, domain);

console.log("Garmin Connect Login… (MFA ggf. im Terminal bestätigen)");
try {
  await client.login(email, password);
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  client.exportTokenToFile(tokenDir);
  console.log("Erfolg! Tokens gespeichert in:", tokenDir);
  console.log("Jetzt in der App: Einstellungen → Garmin synchronisieren");
} catch (err) {
  console.error("Login fehlgeschlagen:", err?.message ?? err);
  process.exit(1);
}
