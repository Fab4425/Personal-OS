import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { chatWithGroq, type GroqMessage } from "@/lib/ai/groq";
import { buildCoachContext } from "@/lib/ai/context";

type AiChatInsert =
  Database["public"]["Tables"]["ai_chat_messages"]["Insert"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { message: string };
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const userName =
    user.user_metadata?.full_name?.toString() ??
    user.email?.split("@")[0] ??
    "Athlet";
  const systemPrompt = await buildCoachContext(supabase, user.id, userName);

  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: body.message },
  ];

  try {
    const reply = await chatWithGroq(messages);
    const rows: AiChatInsert[] = [
      { user_id: user.id, role: "user", content: body.message },
      { user_id: user.id, role: "assistant", content: reply },
    ];
    await supabase.from("ai_chat_messages").insert(rows);
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
