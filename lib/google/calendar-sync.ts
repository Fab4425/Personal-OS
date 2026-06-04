import { subDays } from "date-fns";
import { google, calendar_v3 } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { oauthClientFromTokens } from "@/lib/google/oauth";

type CalendarEventType = "training" | "academic" | "personal" | "project";

interface ConnectedGoogleAccount {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  last_sync_at: string | null;
}

function inferEventType(summary: string): CalendarEventType {
  const s = summary.toLowerCase();
  if (
    s.includes("training") ||
    s.includes("swim") ||
    s.includes("bike") ||
    s.includes("run") ||
    s.includes("ride")
  ) {
    return "training";
  }
  if (
    s.includes("uni") ||
    s.includes("vorlesung") ||
    s.includes("prüfung") ||
    s.includes("exam")
  ) {
    return "academic";
  }
  if (s.includes("projekt") || s.includes("dev") || s.includes("code")) {
    return "project";
  }
  return "personal";
}

function mapGoogleColorToType(
  colorId: string | null | undefined
): CalendarEventType | null {
  if (!colorId) return null;
  const map: Record<string, CalendarEventType> = {
    "1": "academic",
    "7": "training",
    "5": "project",
  };
  return map[colorId] ?? null;
}

async function refreshTokensIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  account: ConnectedGoogleAccount
) {
  const auth = oauthClientFromTokens({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at
      ? new Date(account.expires_at).getTime()
      : undefined,
  });

  const expiresAt = account.expires_at
    ? new Date(account.expires_at).getTime()
    : 0;
  if (Date.now() > expiresAt - 60_000) {
    const { credentials } = await auth.refreshAccessToken();
    await supabase
      .from("connected_accounts")
      .update({
        access_token: credentials.access_token ?? account.access_token,
        refresh_token: credentials.refresh_token ?? account.refresh_token,
        expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : account.expires_at,
      })
      .eq("user_id", userId)
      .eq("provider", "google");
    auth.setCredentials(credentials);
  }

  return auth;
}

export interface CalendarSyncResult {
  pulled: number;
  pushed: number;
}

export async function syncCalendarForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<CalendarSyncResult> {
  const { data: account, error } = await supabase
    .from("connected_accounts")
    .select("access_token, refresh_token, expires_at, last_sync_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error || !account?.refresh_token) {
    throw new Error("Google Kalender ist nicht verbunden");
  }

  const auth = await refreshTokensIfNeeded(supabase, userId, account);
  const calendar = google.calendar({ version: "v3", auth });

  const lastSync = account.last_sync_at
    ? new Date(account.last_sync_at)
    : subDays(new Date(), 30);

  let pulled = 0;
  let pageToken: string | undefined;

  do {
    const listRes = await calendar.events.list({
      calendarId: "primary",
      updatedMin: lastSync.toISOString(),
      singleEvents: true,
      orderBy: "updated",
      maxResults: 100,
      pageToken,
    });

    const items = listRes.data.items ?? [];
    for (const ev of items) {
      if (!ev.id || !ev.start || !ev.end) continue;

      const startAt = ev.start.dateTime ?? ev.start.date;
      const endAt = ev.end.dateTime ?? ev.end.date;
      if (!startAt || !endAt) continue;

      const { data: existing } = await supabase
        .from("calendar_events")
        .select("id, local_changes, updated_at")
        .eq("user_id", userId)
        .eq("google_event_id", ev.id)
        .maybeSingle();

      const localChanges = (existing?.local_changes ?? {}) as Record<
        string,
        unknown
      >;
      const localUpdatedAt =
        typeof localChanges.updatedAt === "string"
          ? new Date(localChanges.updatedAt).getTime()
          : 0;
      const googleUpdated = ev.updated
        ? new Date(ev.updated).getTime()
        : 0;

      if (
        existing &&
        localChanges.dirty === true &&
        localUpdatedAt > googleUpdated
      ) {
        continue;
      }

      const title = ev.summary ?? "Ohne Titel";
      const type =
        mapGoogleColorToType(ev.colorId ?? undefined) ?? inferEventType(title);

      const { error: upsertError } = await supabase
        .from("calendar_events")
        .upsert(
          {
            user_id: userId,
            google_event_id: ev.id,
            title,
            description: ev.description ?? null,
            start_at: new Date(startAt).toISOString(),
            end_at: new Date(endAt).toISOString(),
            type,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            local_changes: existing?.local_changes ?? {},
          },
          { onConflict: "user_id,google_event_id" }
        );

      if (!upsertError) pulled += 1;
    }

    pageToken = listRes.data.nextPageToken ?? undefined;
  } while (pageToken);

  let pushed = 0;
  const { data: allLocal } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId);

  const pending = (allLocal ?? []).filter((row) => {
    const changes = row.local_changes as Record<string, unknown> | null;
    return changes?.dirty === true;
  });

  for (const local of pending) {
    const payload: calendar_v3.Schema$Event = {
      summary: local.title,
      description: local.description ?? undefined,
      start: { dateTime: local.start_at },
      end: { dateTime: local.end_at },
    };

    if (local.google_event_id) {
      await calendar.events.update({
        calendarId: "primary",
        eventId: local.google_event_id,
        requestBody: payload,
      });
    } else {
      const created = await calendar.events.insert({
        calendarId: "primary",
        requestBody: payload,
      });
      if (created.data.id) {
        await supabase
          .from("calendar_events")
          .update({
            google_event_id: created.data.id,
            synced_at: new Date().toISOString(),
            local_changes: {},
          })
          .eq("id", local.id);
      }
    }

    await supabase
      .from("calendar_events")
      .update({
        synced_at: new Date().toISOString(),
        local_changes: {},
      })
      .eq("id", local.id);

    pushed += 1;
  }

  await supabase
    .from("connected_accounts")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", "google");

  return { pulled, pushed };
}
