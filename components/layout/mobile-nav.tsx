"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, Home, MessageSquare, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/training", label: "Training", icon: Activity },
  { href: "/today", label: "Heute", icon: Timer },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/chat", label: "Coach", icon: MessageSquare },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {mobileItems.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
