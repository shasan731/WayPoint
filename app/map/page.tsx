import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MapScreen } from "@/components/map/MapScreen";
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
    <AppShell active="map" fullScreen>
      <MapScreen />
    </AppShell>
  );
}
