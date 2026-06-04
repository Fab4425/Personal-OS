"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Soll ich heute schwimmen oder Ruhetag?",
  "Analysiere meine letzten 4 Wochen Training",
  "Wie ist mein Readiness heute?",
];

interface ChatInterfaceProps {
  initialMessages?: Message[];
}

export function ChatInterface({ initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.error ?? "Fehler beim KI-Request",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Netzwerkfehler — bitte erneut versuchen." },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border bg-card">
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Dein Coach kennt Readiness, Training, Schlaf und Projekte.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Coach denkt nach…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frage stellen…"
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
