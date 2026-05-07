"use client";

import { BatteryCharging, EyeOff, LocateFixed, MapPinOff } from "lucide-react";
import type { FollowingItem } from "@/lib/api-types";
import { cn, formatRelativeTime, isStaleLocation } from "@/lib/utils";
import { useMapStore } from "@/store/map-store";

const statusText: Record<FollowingItem["status"], string> = {
  active: "Active",
  hiddenByPrivacy: "Hidden by ghost mode",
  muted: "Muted key",
  inactiveKey: "Inactive key",
  expiredKey: "Expired key",
  revoked: "Revoked",
  noLocation: "No location yet"
};

export function ConnectionCard({ item }: { item: FollowingItem }) {
  const selectConnection = useMapStore((state) => state.selectConnection);
  const setCenter = useMapStore((state) => state.setCenter);
  const stale = isStaleLocation(item.location?.lastUpdated);
  const canCenter = Boolean(item.location);

  return (
    <button
      type="button"
      disabled={!canCenter}
      onClick={() => {
        if (item.location) {
          setCenter([item.location.lat, item.location.lng]);
          selectConnection(item.connectionId);
        }
      }}
      className={cn(
        "w-full rounded-md border border-border bg-white p-4 text-left transition hover:border-primary/40 disabled:cursor-default disabled:hover:border-border",
        item.status !== "active" && "bg-muted/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.owner.name ?? "Unnamed contact"}</p>
          <p className="truncate text-xs text-muted-foreground">{item.accessKey.label}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-medium",
            item.status === "active" && !stale && "bg-emerald-50 text-emerald-700",
            item.status === "active" && stale && "bg-stone-100 text-stone-700",
            item.status !== "active" && "bg-amber-50 text-amber-800"
          )}
        >
          {stale && item.status === "active" ? "Stale" : statusText[item.status]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {item.location ? (
          <>
            <span className="flex items-center gap-1.5">
              <LocateFixed className="h-3.5 w-3.5" />
              {formatRelativeTime(item.location.lastUpdated)}
            </span>
            {item.battery ? (
              <span className="flex items-center gap-1.5">
                <BatteryCharging className="h-3.5 w-3.5" />
                {item.battery.batteryLevel ?? "Unknown"}%
              </span>
            ) : null}
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            {item.status === "hiddenByPrivacy" || item.status === "muted" ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <MapPinOff className="h-3.5 w-3.5" />
            )}
            Location unavailable
          </span>
        )}
      </div>
    </button>
  );
}
