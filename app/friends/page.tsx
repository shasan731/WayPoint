import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConnectionsOverview } from "@/components/connections/ConnectionsOverview";
import { FollowingList } from "@/components/connections/FollowingList";
import { JoinKeyForm } from "@/components/connections/JoinKeyForm";
import { AppShell } from "@/components/layout/AppShell";
import { TrackingStatus } from "@/components/location/TrackingStatus";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Friends"
};

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell active="friends">
      <div className="mx-auto grid w-full max-w-4xl gap-4 p-4 md:p-6">
        <div className="md:hidden">
          <TrackingStatus />
        </div>
        <JoinKeyForm />
        <FollowingList />
        <ConnectionsOverview />
      </div>
    </AppShell>
  );
}
