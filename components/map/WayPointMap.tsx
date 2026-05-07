"use client";

import dynamic from "next/dynamic";
import { MapPinned, WifiOff } from "lucide-react";
import { useMemo } from "react";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import type { FollowingItem } from "@/lib/api-types";
import { useFollowingQuery } from "@/lib/use-following-query";

const LeafletMapInner = dynamic(
  () => import("@/components/map/LeafletMapInner").then((module) => module.LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[320px] place-items-center bg-muted">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPinned className="h-4 w-4" />
          Loading map
        </div>
      </div>
    )
  }
);

export function WayPointMap({
  className = "",
  items: providedItems,
  selectedConnectionId = null,
  showOfflineBadge = true
}: {
  className?: string;
  items?: FollowingItem[];
  selectedConnectionId?: string | null;
  showOfflineBadge?: boolean;
}) {
  const { query: following, online } = useFollowingQuery({ enabled: !providedItems });
  const items = useMemo(() => providedItems ?? following.data?.items ?? [], [following.data?.items, providedItems]);
  const visibleItems = useMemo(
    () => (selectedConnectionId ? items.filter((item) => item.connectionId === selectedConnectionId) : items),
    [items, selectedConnectionId]
  );

  return (
    <div className={`relative overflow-hidden rounded-md border border-border bg-muted ${className}`}>
      {!online && showOfflineBadge ? (
        <div className="absolute left-4 top-4 z-[20] flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 shadow-sm">
          <WifiOff className="h-4 w-4" />
          Offline
        </div>
      ) : null}
      <MapErrorBoundary>
        <LeafletMapInner items={visibleItems} selectedConnectionId={selectedConnectionId} />
      </MapErrorBoundary>
    </div>
  );
}
