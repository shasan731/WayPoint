import Link from "next/link";
import { KeyRound, Map, Settings, ShieldCheck, SquareStack, UsersRound } from "lucide-react";
import { TrackingStatus } from "@/components/location/TrackingStatus";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: SquareStack, id: "dashboard" },
  { href: "/map", label: "Live map", icon: Map, id: "map" },
  { href: "/friends", label: "Friends", icon: UsersRound, id: "friends" },
  { href: "/keys", label: "Access keys", icon: KeyRound, id: "keys" },
  { href: "/settings", label: "Settings", icon: Settings, id: "settings" }
];

export function DesktopSidebar({ active }: { active: "dashboard" | "map" | "friends" | "keys" | "settings" }) {
  return (
    <aside className="hidden h-dvh w-80 shrink-0 border-r border-border bg-white p-4 md:flex md:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-2 py-2">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">WayPoint</p>
          <p className="text-xs text-muted-foreground">Private location sharing</p>
        </div>
      </Link>

      <nav className="mt-6 grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.id === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                selected && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <TrackingStatus />
      </div>

      <div className="mt-auto rounded-md border border-border bg-muted p-3 text-xs leading-5 text-muted-foreground">
        Browser PWAs sync while active, on resume, and after reconnect. Continuous native background tracking is not
        claimed or required.
      </div>
    </aside>
  );
}
