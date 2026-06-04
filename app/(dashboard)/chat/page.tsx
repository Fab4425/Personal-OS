import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/page-shell";
import { ChatInterface } from "@/components/ai/ChatInterface";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: history } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true })
    .limit(40);

  const initialMessages = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <PageShell
      title="KI Coach"
      description="Groq · Kontext aus Training & Projekten"
      userEmail={user?.email}
      moduleName="KI Chat"
    >
      <ChatInterface initialMessages={initialMessages} />
    </PageShell>
  );
}
