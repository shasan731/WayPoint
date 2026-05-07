import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyManager } from "@/components/keys/KeyManager";
import { AppShell } from "@/components/layout/AppShell";
import { TrackingStatus } from "@/components/location/TrackingStatus";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Access keys"
};

export default async function KeysPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell active="keys">
      <div className="mx-auto grid w-full max-w-4xl gap-4 p-4 md:p-6">
        <div className="md:hidden">
          <TrackingStatus />
        </div>
        <KeyManager />
      </div>
    </AppShell>
  );
}
