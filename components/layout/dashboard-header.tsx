"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  userEmail?: string | null;
}

export function DashboardHeader({
  title,
  description,
  userEmail,
}: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "PO";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Abmelden</span>
        </Button>
      </div>
    </header>
  );
}
