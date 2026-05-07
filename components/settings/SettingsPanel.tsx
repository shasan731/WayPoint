"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { BatteryCharging, EyeOff, History, LogOut, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { fetchSettings, updateSettings } from "@/lib/client-api";
import { formatRelativeTime } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const trackingEnabled = useUiStore((state) => state.trackingEnabled);
  const setTrackingEnabled = useUiStore((state) => state.setTrackingEnabled);
  const trackingState = useUiStore((state) => state.trackingState);

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings
  });

  const mutation = useMutation({
    mutationFn: (input: Partial<NonNullable<typeof settings.data>["item"]>) => updateSettings(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["settings"] });
      const previous = queryClient.getQueryData(["settings"]);
      queryClient.setQueryData(["settings"], (old: typeof settings.data) =>
        old ? { item: { ...old.item, ...input } } : old
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["settings"], context.previous);
      }
      pushToast({ type: "error", title: "Settings update failed", description: error.message });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["following"] });
      pushToast({ type: "success", title: "Settings saved" });
    }
  });

  const item = settings.data?.item;

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div>
        <h1 className="text-lg font-semibold">Privacy settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These controls are enforced on the server before follower location data is returned.
        </p>
      </div>

      {settings.isLoading || !item ? (
        <div className="mt-6 grid gap-3">
          <div className="h-14 animate-pulse rounded bg-muted" />
          <div className="h-14 animate-pulse rounded bg-muted" />
          <div className="h-14 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-semibold">{item.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">Last seen {formatRelativeTime(item.lastSeenAt)}</p>
          </div>

          <SettingRow
            icon={<EyeOff className="h-4 w-4" />}
            title="Ghost mode"
            description="Accept updates but hide your location from all followers."
            checked={item.globalGhostMode}
            onCheckedChange={(checked) => mutation.mutate({ globalGhostMode: checked })}
            disabled={mutation.isPending}
          />
          <SettingRow
            icon={<BatteryCharging className="h-4 w-4" />}
            title="Share battery"
            description="Return battery level and charging state only when your browser exposes it."
            checked={item.shareBattery}
            onCheckedChange={(checked) => mutation.mutate({ shareBattery: checked })}
            disabled={mutation.isPending}
          />
          <SettingRow
            icon={<History className="h-4 w-4" />}
            title="Location history"
            description="Store location history in addition to the latest location. Off by default."
            checked={item.allowLocationHistory}
            onCheckedChange={(checked) => mutation.mutate({ allowLocationHistory: checked })}
            disabled={mutation.isPending}
          />
          <SettingRow
            icon={<BatteryCharging className="h-4 w-4" />}
            title="Tracking enabled"
            description={`Local browser transmitter state: ${trackingState}.`}
            checked={trackingEnabled}
            onCheckedChange={setTrackingEnabled}
          />

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                window.localStorage.removeItem("waypoint:last-location-update");
                window.localStorage.removeItem("waypoint:tracking-enabled");
                if ("caches" in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.filter((key) => key.startsWith("waypoint")).map((key) => caches.delete(key)));
                }
                pushToast({ type: "success", title: "Local cache cleared" });
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear local cache
            </Button>
            <Button type="button" variant="destructive" onClick={() => void signOut({ callbackUrl: "/sign-in" })}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onCheckedChange
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch label={`Toggle ${title}`} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}
