"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { FollowingItem } from "@/lib/api-types";
import { LocationMarker } from "@/components/map/LocationMarker";
import { useMapStore } from "@/store/map-store";

export function LeafletMapInner({
  items,
  selectedConnectionId
}: {
  items: FollowingItem[];
  selectedConnectionId: string | null;
}) {
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} className="z-0 h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileUrl}
      />
      <ZoomControl position="bottomright" />
      <MapViewportController items={items} selectedConnectionId={selectedConnectionId} />
      {items.map((item) => (
        <LocationMarker key={item.connectionId} item={item} />
      ))}
    </MapContainer>
  );
}

function MapViewportController({
  items,
  selectedConnectionId
}: {
  items: FollowingItem[];
  selectedConnectionId: string | null;
}) {
  const map = useMap();
  const points = useMemo(
    () =>
      items
        .filter((item) => item.location)
        .map((item) => ({
          id: item.connectionId,
          lat: item.location?.lat ?? 0,
          lng: item.location?.lng ?? 0
        })),
    [items]
  );
  const signature = `${selectedConnectionId ?? "all"}:${points.map((point) => `${point.id}:${point.lat}:${point.lng}`).join("|")}`;

  useEffect(() => {
    map.invalidateSize();

    if (points.length === 0) {
      return;
    }

    if (selectedConnectionId) {
      const selected = points.find((point) => point.id === selectedConnectionId);
      if (selected) {
        map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { duration: 0.55 });
      }
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 13), { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14, animate: true });
  }, [map, points, selectedConnectionId, signature]);

  return null;
}
