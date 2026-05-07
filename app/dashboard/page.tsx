import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TrackingStatus } from "@/components/location/TrackingStatus";
import { WayPointMap } from "@/components/map/WayPointMap";
import { FollowingList } from "@/components/connections/FollowingList";
import { ConnectionsOverview } from "@/components/connections/ConnectionsOverview";
import { JoinKeyForm } from "@/components/connections/JoinKeyForm";
import { KeyManager } from "@/components/keys/KeyManager";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell active="dashboard">
      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 md:grid-cols-[minmax(0,1fr)_24rem] md:p-6">
        <section className="grid min-h-[55dvh] gap-4 md:min-h-[calc(100dvh-3rem)]">
          <div className="md:hidden">
            <TrackingStatus />
          </div>
          <WayPointMap className="h-[56dvh] min-h-[360px] md:h-full" />
        </section>

        <aside className="grid gap-4">
          <JoinKeyForm />
          <FollowingList />
          <ConnectionsOverview />
          <KeyManager />
          <SettingsPanel />
        </aside>
      </div>
    </AppShell>
  );
}
