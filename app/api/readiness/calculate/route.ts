import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateReadinessForUser } from "@/lib/readiness/calculate";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await calculateReadinessForUser(supabase, user.id);
    return NextResponse.json({ ok: true, readiness: result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Readiness calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
