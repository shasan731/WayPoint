"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import type { FollowingItem } from "@/lib/api-types";
import { LocationMarker } from "@/components/map/LocationMarker";
import { useMapStore } from "@/store/map-store";

export function LeafletMapInner({ items }: { items: FollowingItem[] }) {
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
      {items.map((item) => (
        <LocationMarker key={item.connectionId} item={item} />
      ))}
    </MapContainer>
  );
}
