"use client";

import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { FollowingItem } from "@/lib/api-types";
import { formatRelativeTime, isStaleLocation } from "@/lib/utils";
import { useMapStore } from "@/store/map-store";

function makeIcon(stale: boolean) {
  return L.divIcon({
    className: "",
    html: `<span class="waypoint-marker ${stale ? "waypoint-marker-stale" : ""}"><span class="waypoint-marker-dot"></span></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14]
  });
}

export function LocationMarker({ item }: { item: FollowingItem }) {
  const map = useMap();
  const selectedConnectionId = useMapStore((state) => state.selectedConnectionId);
  const stale = isStaleLocation(item.location?.lastUpdated);

  useEffect(() => {
    if (selectedConnectionId === item.connectionId && item.location) {
      map.flyTo([item.location.lat, item.location.lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
    }
  }, [item, map, selectedConnectionId]);

  if (!item.location) {
    return null;
  }

  return (
    <Marker position={[item.location.lat, item.location.lng]} icon={makeIcon(stale)}>
      <Popup>
        <div className="min-w-48">
          <p className="font-semibold">{item.owner.name ?? "Unnamed contact"}</p>
          <p className="text-xs text-muted-foreground">{item.accessKey.label}</p>
          <p className="mt-2 text-sm">{stale ? "Stale location" : "Active location"}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(item.location.lastUpdated)}</p>
          {item.battery ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Battery {item.battery.batteryLevel ?? "unknown"}%
              {item.battery.isCharging ? " and charging" : ""}
            </p>
          ) : null}
        </div>
      </Popup>
    </Marker>
  );
}
