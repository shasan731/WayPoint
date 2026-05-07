import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings"
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell active="settings">
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <SettingsPanel />
      </div>
    </AppShell>
  );
}
