"use client";

import { BatteryCharging, EyeOff, Layers3, LocateFixed, MapPinOff, UsersRound, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FollowingItem } from "@/lib/api-types";
import { cn, formatRelativeTime, isStaleLocation } from "@/lib/utils";
import { useFollowingQuery } from "@/lib/use-following-query";
import { useMapStore } from "@/store/map-store";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { WayPointMap } from "@/components/map/WayPointMap";

const statusText: Record<FollowingItem["status"], string> = {
  active: "Active",
  hiddenByPrivacy: "Hidden",
  muted: "Muted",
  inactiveKey: "Inactive key",
  expiredKey: "Expired key",
  revoked: "Revoked",
  noLocation: "No location"
};

export function MapScreen() {
  const { query: following, online } = useFollowingQuery();
  const items = useMemo(() => following.data?.items ?? [], [following.data?.items]);
  const selectedConnectionId = useMapStore((state) => state.selectedConnectionId);
  const selectConnection = useMapStore((state) => state.selectConnection);
  const setCenter = useMapStore((state) => state.setCenter);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.connectionId === selectedConnectionId) ?? null,
    [items, selectedConnectionId]
  );
  const visibleCount = items.filter((item) => item.location).length;

  useEffect(() => {
    if (selectedConnectionId && !selectedItem) {
      selectConnection(null);
    }
  }, [selectConnection, selectedConnectionId, selectedItem]);

  function selectItem(item: FollowingItem | null) {
    selectConnection(item?.connectionId ?? null);
    if (item?.location) {
      setCenter([item.location.lat, item.location.lng]);
    }
  }

  return (
    <div className="relative h-full overflow-hidden bg-muted pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <WayPointMap
        className="absolute inset-0 h-full rounded-none border-0"
        items={items}
        selectedConnectionId={selectedConnectionId}
        showOfflineBadge={false}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[25] p-3 pt-[max(env(safe-area-inset-top),0.75rem)] md:hidden">
        <CompactTrackingPill />
      </div>

      {!online ? (
        <div className="absolute left-3 right-3 top-20 z-[26] flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 shadow-sm md:left-auto md:right-4 md:top-4">
          <WifiOff className="h-4 w-4" />
          Offline. Map polling is paused.
        </div>
      ) : null}

      <section
        className={cn(
          "absolute inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[35] overflow-hidden rounded-t-2xl border-t border-border bg-white/96 shadow-[0_-16px_45px_rgb(15_23_42_/_0.18)] backdrop-blur md:bottom-4 md:left-4 md:right-auto md:w-[25rem] md:rounded-md md:border md:shadow-panel",
          sheetExpanded ? "max-h-[72dvh]" : "max-h-[42dvh]"
        )}
      >
        <button
          type="button"
          aria-label={sheetExpanded ? "Collapse friend sheet" : "Expand friend sheet"}
          className="grid w-full place-items-center px-4 py-2 md:hidden"
          onClick={() => setSheetExpanded((value) => !value)}
        >
          <span className="h-1.5 w-12 rounded-full bg-border" />
        </button>

        <div className="border-b border-border px-4 pb-3 md:pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold">Live map</h1>
              <p className="text-xs text-muted-foreground">
                {selectedItem ? selectedItem.owner.name ?? "Selected friend" : `${visibleCount} friends visible`}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => selectItem(null)}>
              <Layers3 className="h-4 w-4" />
              All
            </Button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FriendChip selected={!selectedConnectionId} label="All friends" count={items.length} onClick={() => selectItem(null)} />
            {items.map((item) => (
              <FriendChip
                key={item.connectionId}
                selected={selectedConnectionId === item.connectionId}
                label={item.owner.name ?? "Unnamed"}
                status={item.status}
                hasLocation={Boolean(item.location)}
                onClick={() => selectItem(item)}
              />
            ))}
          </div>
        </div>

        <div className="max-h-[calc(72dvh-8rem)] overflow-y-auto p-4">
          {following.isLoading ? (
            <div className="grid gap-3">
              <FriendSkeleton />
              <FriendSkeleton />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/50 p-5 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No friends yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Join a share link to see live locations here.</p>
            </div>
          ) : selectedItem ? (
            <MapFriendCard item={selectedItem} selected onSelect={() => selectItem(selectedItem)} />
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <MapFriendCard key={item.connectionId} item={item} onSelect={() => selectItem(item)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CompactTrackingPill() {
  const trackingEnabled = useUiStore((state) => state.trackingEnabled);
  const trackingState = useUiStore((state) => state.trackingState);
  const setTrackingEnabled = useUiStore((state) => state.setTrackingEnabled);
  const active = trackingState === "tracking" || trackingState === "syncing" || trackingState === "requestingPermission";

  return (
    <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border border-border bg-white/96 px-3 py-2 shadow-panel backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", active ? "bg-emerald-500" : "bg-stone-400")} />
        <span className="truncate text-sm font-semibold">{active ? "Tracking active" : "Tracking paused"}</span>
      </div>
      <button
        type="button"
        className="min-h-8 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"
        onClick={() => setTrackingEnabled(!trackingEnabled)}
      >
        {trackingEnabled ? "Pause" : "Enable"}
      </button>
    </div>
  );
}

function FriendChip({
  selected,
  label,
  count,
  status,
  hasLocation = true,
  onClick
}: {
  selected: boolean;
  label: string;
  count?: number;
  status?: FollowingItem["status"];
  hasLocation?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition active:scale-[0.98]",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground"
      )}
      onClick={onClick}
    >
      <span className={cn("h-2 w-2 rounded-full", hasLocation ? "bg-emerald-500" : "bg-stone-400")} />
      <span>{label}</span>
      {typeof count === "number" ? <span className="text-xs opacity-75">{count}</span> : null}
      {status && status !== "active" ? <span className="text-xs opacity-75">{statusText[status]}</span> : null}
    </button>
  );
}

function MapFriendCard({ item, selected = false, onSelect }: { item: FollowingItem; selected?: boolean; onSelect: () => void }) {
  const stale = isStaleLocation(item.location?.lastUpdated);

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-md border bg-white p-4 text-left transition active:scale-[0.99]",
        selected ? "border-primary shadow-sm" : "border-border",
        !item.location && "bg-muted/70"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.owner.name ?? "Unnamed friend"}</p>
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

function FriendSkeleton() {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-5 h-3 w-52 animate-pulse rounded bg-muted" />
    </div>
  );
}
