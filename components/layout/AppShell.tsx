import { LocationTransmitter } from "@/components/location/LocationTransmitter";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function AppShell({
  active,
  children
}: {
  active: "dashboard" | "map" | "settings";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LocationTransmitter />
      <div className="flex min-h-dvh">
        <DesktopSidebar active={active} />
        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav active={active} />
    </div>
  );
}
