import { getBatterySnapshot } from "@/lib/location/battery";
import { getBrowserLocation, type BrowserLocation } from "@/lib/location/getBrowserLocation";

export type LocationUpdatePayload = BrowserLocation & {
  batteryLevel: number | null;
  isCharging: boolean | null;
};

const QUEUE_KEY = "waypoint:last-location-update";

export async function buildLocationPayload(): Promise<LocationUpdatePayload> {
  const [location, battery] = await Promise.all([getBrowserLocation(), getBatterySnapshot()]);

  return {
    ...location,
    batteryLevel: battery.batteryLevel,
    isCharging: battery.isCharging
  };
}

export function queueLatestLocationUpdate(payload: LocationUpdatePayload) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify({ payload, queuedAt: new Date().toISOString() }));
}

export function readQueuedLocationUpdate(): LocationUpdatePayload | null {
  const raw = window.localStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { payload?: LocationUpdatePayload };
    return parsed.payload ?? null;
  } catch {
    window.localStorage.removeItem(QUEUE_KEY);
    return null;
  }
}

export function clearQueuedLocationUpdate() {
  window.localStorage.removeItem(QUEUE_KEY);
}

export async function sendLocationPayload(payload: LocationUpdatePayload): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch("/api/location/update", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const result = (await response.json().catch(() => null)) as { lastUpdated?: string; error?: string } | null;

    if (!response.ok) {
      throw new Error(result?.error ?? `Location update failed with ${response.status}.`);
    }

    return result?.lastUpdated ?? new Date().toISOString();
  } finally {
    window.clearTimeout(timeout);
  }
}
