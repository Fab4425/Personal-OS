"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar,
  FolderKanban,
  Home,
  MessageSquare,
  Settings,
  Sun,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Übersicht", icon: Home },
  { href: "/training", label: "Training", icon: Activity },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/today", label: "Heute", icon: Timer },
  { href: "/projects", label: "Projekte", icon: FolderKanban },
  { href: "/academic", label: "Akademie", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/chat", label: "KI Coach", icon: MessageSquare },
  { href: "/settings", label: "Einstellungen", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sun className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">
            Personal OS
          </p>
          <p className="text-xs text-muted-foreground">Triathlon · KI · Life</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <p className="p-4 text-xs text-muted-foreground">Phase 4 · Polish</p>
    </aside>
  );
}
