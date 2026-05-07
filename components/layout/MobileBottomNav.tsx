"use client";

import Link from "next/link";
import { KeyRound, Map, Settings, SquareStack } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: SquareStack },
  { href: "/map", label: "Map", icon: Map },
  { href: "/dashboard#keys", label: "Keys", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function MobileBottomNav({ active }: { active: "dashboard" | "map" | "settings" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected =
            (active === "dashboard" && item.href.startsWith("/dashboard")) ||
            (active === "map" && item.href === "/map") ||
            (active === "settings" && item.href === "/settings");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground",
                selected && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
