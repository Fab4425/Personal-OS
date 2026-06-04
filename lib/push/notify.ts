import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push/send";

export async function notifyWeeklyReviewReady(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string
): Promise<void> {
  await sendPushToUser(supabase, userId, {
    title: "Wochen-Review bereit",
    body: `Dein Review für die Woche ab ${weekStart} ist da.`,
    url: "/today",
  });
}
