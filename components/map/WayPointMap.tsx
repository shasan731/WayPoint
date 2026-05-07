"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { MapPinned, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { fetchFollowing } from "@/lib/client-api";

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

export function WayPointMap({ className = "" }: { className?: string }) {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [hidden, setHidden] = useState(() => (typeof document === "undefined" ? false : document.hidden));

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onVisibility = () => setHidden(document.hidden);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const following = useQuery({
    queryKey: ["following"],
    queryFn: fetchFollowing,
    enabled: online,
    refetchInterval: online ? (hidden ? 60_000 : 10_000) : false
  });

  const items = following.data?.items ?? [];

  return (
    <div className={`relative overflow-hidden rounded-md border border-border bg-muted ${className}`}>
      {!online ? (
        <div className="absolute left-4 top-4 z-[20] flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 shadow-sm">
          <WifiOff className="h-4 w-4" />
          Offline
        </div>
      ) : null}
      <MapErrorBoundary>
        <LeafletMapInner items={items} />
      </MapErrorBoundary>
    </div>
  );
}
