"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  buildLocationPayload,
  clearQueuedLocationUpdate,
  queueLatestLocationUpdate,
  readQueuedLocationUpdate,
  sendLocationPayload,
  type LocationUpdatePayload
} from "@/lib/location/transmitter";
import { useUiStore } from "@/store/ui-store";

const BACKOFF_DELAYS = [5_000, 10_000, 20_000, 40_000, 60_000];
const TRACKING_KEY = "waypoint:tracking-enabled";

export function LocationTransmitter() {
  const trackingEnabled = useUiStore((state) => state.trackingEnabled);
  const setTrackingEnabled = useUiStore((state) => state.setTrackingEnabled);
  const setTrackingState = useUiStore((state) => state.setTrackingState);
  const setLastLocationSyncAt = useUiStore((state) => state.setLastLocationSyncAt);
  const pushToast = useUiStore((state) => state.pushToast);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const scheduleRetryRef = useRef<(payload: LocationUpdatePayload, message: string) => void>(() => {});

  useEffect(() => {
    const saved = window.localStorage.getItem(TRACKING_KEY);
    if (saved === "true") {
      setTrackingEnabled(true);
    }
  }, [setTrackingEnabled]);

  useEffect(() => {
    window.localStorage.setItem(TRACKING_KEY, String(trackingEnabled));
  }, [trackingEnabled]);

  const sendPayload = useCallback(
    async (payload: LocationUpdatePayload) => {
      const lastUpdated = await sendLocationPayload(payload);
      clearQueuedLocationUpdate();
      retryCountRef.current = 0;
      setTrackingState("tracking");
      setLastLocationSyncAt(lastUpdated);
    },
    [setLastLocationSyncAt, setTrackingState]
  );

  const runRetry = useCallback(
    async (payload: LocationUpdatePayload) => {
      try {
        await sendPayload(payload);
      } catch (error) {
        scheduleRetryRef.current(payload, error instanceof Error ? error.message : "Location sync failed.");
      }
    },
    [sendPayload]
  );

  const scheduleRetry = useCallback(
    (payload: LocationUpdatePayload, message: string) => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }

      const delay = BACKOFF_DELAYS[Math.min(retryCountRef.current, BACKOFF_DELAYS.length - 1)];
      retryCountRef.current += 1;
      setTrackingState("error", message);

      retryTimerRef.current = window.setTimeout(() => {
        void runRetry(payload);
      }, delay);
    },
    [runRetry, setTrackingState]
  );

  useEffect(() => {
    scheduleRetryRef.current = scheduleRetry;
  }, [scheduleRetry]);

  const syncLatest = useCallback(
    async (reason: "interval" | "resume" | "online" | "manual") => {
      if (!trackingEnabled) {
        return;
      }

      if (!navigator.onLine) {
        setTrackingState("offline");
        try {
          queueLatestLocationUpdate(await buildLocationPayload());
        } catch {
          // Keep the offline state even if the browser cannot provide a fresh fix.
        }
        return;
      }

      setTrackingState(reason === "manual" ? "requestingPermission" : "syncing");

      try {
        const queued = readQueuedLocationUpdate();
        if (queued) {
          await sendPayload(queued);
        }

        await sendPayload(await buildLocationPayload());
      } catch (error) {
        const geolocationError = error as GeolocationPositionError;
        if (geolocationError.code === 1) {
          setTrackingState("permissionDenied", "Location permission was denied.");
          setTrackingEnabled(false);
          pushToast({
            type: "error",
            title: "Location permission denied",
            description: "Enable browser location access before turning tracking on."
          });
          return;
        }

        const message = error instanceof Error ? error.message : "Location sync failed.";
        if (message.includes("401") || message.includes("403")) {
          setTrackingState("error", message);
          setTrackingEnabled(false);
          return;
        }

        const payload = readQueuedLocationUpdate();
        if (payload) {
          scheduleRetry(payload, message);
        } else {
          setTrackingState("error", message);
        }
      }
    },
    [pushToast, scheduleRetry, sendPayload, setTrackingEnabled, setTrackingState, trackingEnabled]
  );

  useEffect(() => {
    if (!trackingEnabled) {
      setTrackingState("idle");
      return;
    }

    void syncLatest("manual");

    const interval = window.setInterval(() => {
      void syncLatest("interval");
    }, document.hidden ? 60_000 : 10_000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void syncLatest("resume");
      }
    };

    const onOnline = () => void syncLatest("online");
    const onOffline = () => setTrackingState("offline");

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, [setTrackingState, syncLatest, trackingEnabled]);

  return null;
}
