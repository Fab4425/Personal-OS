import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importTrainingPlanJson } from "@/lib/training/plan-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
      }
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const result = await importTrainingPlanJson(
        supabase,
        user.id,
        json,
        file.name
      );
      return NextResponse.json({ ok: true, ...result });
    }

    const json = (await request.json()) as unknown;
    const result = await importTrainingPlanJson(supabase, user.id, json);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof SyntaxError
        ? "Ungültiges JSON"
        : err instanceof Error
          ? err.message
          : "Import fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
