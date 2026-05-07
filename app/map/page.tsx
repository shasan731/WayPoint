import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FollowingList } from "@/components/connections/FollowingList";
import { AppShell } from "@/components/layout/AppShell";
import { TrackingStatus } from "@/components/location/TrackingStatus";
import { WayPointMap } from "@/components/map/WayPointMap";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Live map"
};

export default async function MapPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell active="map">
      <div className="relative h-[calc(100dvh-5rem)] md:h-dvh">
        <WayPointMap className="h-full rounded-none border-0" />
        <div className="absolute inset-x-3 bottom-3 z-[30] max-h-[48dvh] overflow-auto rounded-md border border-border bg-white/95 p-3 shadow-panel backdrop-blur md:left-4 md:right-auto md:top-4 md:h-[calc(100dvh-2rem)] md:max-h-none md:w-96 md:overflow-auto">
          <div className="md:hidden">
            <TrackingStatus />
            <div className="h-3" />
          </div>
          <FollowingList compact />
        </div>
      </div>
    </AppShell>
  );
}
