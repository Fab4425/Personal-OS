import type { SupabaseClient } from "@supabase/supabase-js";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!isPushConfigured()) return;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const webpush = await import("web-push");
  const subject =
    process.env.VAPID_SUBJECT ??
    `mailto:notify@${(process.env.NEXT_PUBLIC_SITE_URL ?? "localhost").replace(/^https?:\/\//, "")}`;
  webpush.setVapidDetails(
    subject,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notification
      )
    )
  );
}
