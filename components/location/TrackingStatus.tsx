"use client";

import { BatteryCharging, CircleAlert, LocateFixed, Power, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const labels = {
  idle: "Tracking paused",
  requestingPermission: "Requesting location",
  tracking: "Tracking active",
  permissionDenied: "Permission denied",
  offline: "Offline",
  syncing: "Syncing location",
  error: "Sync error"
};

export function TrackingStatus() {
  const trackingEnabled = useUiStore((state) => state.trackingEnabled);
  const trackingState = useUiStore((state) => state.trackingState);
  const trackingError = useUiStore((state) => state.trackingError);
  const lastLocationSyncAt = useUiStore((state) => state.lastLocationSyncAt);
  const setTrackingEnabled = useUiStore((state) => state.setTrackingEnabled);

  const isActive = trackingState === "tracking" || trackingState === "syncing" || trackingState === "requestingPermission";

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "relative flex h-3 w-3 rounded-full",
                isActive ? "bg-emerald-500" : trackingState === "offline" ? "bg-amber-500" : "bg-muted-foreground"
              )}
            >
              {isActive ? <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulseRing" /> : null}
            </span>
            <h2 className="text-sm font-semibold">{labels[trackingState]}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {trackingError ?? `Last sync: ${formatRelativeTime(lastLocationSyncAt)}`}
          </p>
        </div>
        <Button
          type="button"
          variant={trackingEnabled ? "secondary" : "primary"}
          size="sm"
          onClick={() => setTrackingEnabled(!trackingEnabled)}
          aria-label={trackingEnabled ? "Pause location tracking" : "Enable location tracking"}
        >
          {trackingEnabled ? <Power className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />}
          {trackingEnabled ? "Pause" : "Enable"}
        </Button>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-2">
          <LocateFixed className="h-3.5 w-3.5" />
          Foreground 10s
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-2">
          <WifiOff className="h-3.5 w-3.5" />
          Offline queue
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-2">
          <BatteryCharging className="h-3.5 w-3.5" />
          Battery optional
        </div>
      </div>
      {trackingState === "permissionDenied" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-700">
          <CircleAlert className="h-4 w-4" />
          Browser permission must be changed before tracking can resume.
        </p>
      ) : null}
    </section>
  );
}
