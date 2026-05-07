import { LocationTransmitter } from "@/components/location/LocationTransmitter";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function AppShell({
  active,
  fullScreen = false,
  children
}: {
  active: "dashboard" | "map" | "friends" | "keys" | "settings";
  fullScreen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <LocationTransmitter />
      <div className="flex h-full min-h-0">
        <DesktopSidebar active={active} />
        <main className={fullScreen ? "min-h-0 min-w-0 flex-1" : "min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0"}>
          {children}
        </main>
      </div>
      <MobileBottomNav active={active} />
    </div>
  );
}
