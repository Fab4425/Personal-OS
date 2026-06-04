import fs from "fs";
import path from "path";
import { GarminConnect } from "garmin-connect";
import { readEnvCredential } from "@/lib/env/credentials";
import { formatGarminLoginError } from "@/lib/garmin/errors";

type GarminClient = InstanceType<typeof GarminConnect>;

let cachedClient: GarminClient | null = null;

function getTokenDir(): string {
  return (
    process.env.GARMIN_TOKEN_PATH?.trim() ||
    path.join(process.cwd(), ".garmin-tokens")
  );
}

function getGarminDomain(): "garmin.com" | "garmin.cn" {
  const domain = process.env.GARMIN_DOMAIN?.trim() as
    | "garmin.com"
    | "garmin.cn"
    | undefined;
  if (domain === "garmin.cn" || domain === "garmin.com") {
    return domain;
  }
  return "garmin.com";
}

function tokenFilesExist(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "oauth1_token.json")) &&
    fs.existsSync(path.join(dir, "oauth2_token.json"))
  );
}

export async function getGarminClient(): Promise<GarminClient> {
  const email = readEnvCredential(process.env.GARMIN_EMAIL);
  const password = readEnvCredential(process.env.GARMIN_PASSWORD);

  if (!email || !password) {
    throw new Error("GARMIN_EMAIL und GARMIN_PASSWORD fehlen in .env.local");
  }

  if (cachedClient) {
    return cachedClient;
  }

  const domain = getGarminDomain();
  const tokenDir = getTokenDir();
  const client = new GarminConnect({ username: email, password }, domain);

  if (tokenFilesExist(tokenDir)) {
    try {
      client.loadTokenByFile(tokenDir);
      cachedClient = client;
      return client;
    } catch {
      resetGarminClientCache();
    }
  }

  try {
    await client.login(email, password);
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
    }
    client.exportTokenToFile(tokenDir);
    cachedClient = client;
    return client;
  } catch (err) {
    resetGarminClientCache();
    throw new Error(formatGarminLoginError(err));
  }
}

export function resetGarminClientCache(): void {
  cachedClient = null;
}

export function getGarminTokenDir(): string {
  return getTokenDir();
}
