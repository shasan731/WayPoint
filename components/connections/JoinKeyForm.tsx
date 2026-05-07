"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IScannerControls } from "@zxing/browser";
import { Camera, KeyRound, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { joinConnection } from "@/lib/client-api";
import { useUiStore } from "@/store/ui-store";

export function JoinKeyForm() {
  const [shareToken, setShareToken] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const mutation = useMutation({
    mutationFn: (token: string) => joinConnection(token),
    onSuccess: () => {
      setShareToken("");
      void queryClient.invalidateQueries({ queryKey: ["following"] });
      void queryClient.invalidateQueries({ queryKey: ["connections"] });
      pushToast({ type: "success", title: "Friend added", description: "Their location will appear when it is available." });
    },
    onError: (error) => {
      pushToast({ type: "error", title: "Could not add friend", description: error.message });
    }
  });

  const trimmedToken = shareToken.trim();

  useEffect(() => {
    if (!scannerOpen) {
      return;
    }

    let cancelled = false;

    async function startScanner() {
      setScannerError(null);

      try {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 350,
          delayBetweenScanSuccess: 700
        });

        const controls = await reader.decodeFromVideoDevice(undefined, video, (result, _error, callbackControls) => {
          const scannedText = result?.getText()?.trim();
          if (!scannedText) {
            return;
          }

          const token = normalizeScannedKey(scannedText);
          setShareToken(token);
          setScannerOpen(false);
          callbackControls.stop();
          pushToast({ type: "success", title: "QR code scanned" });
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        scannerControlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setScannerError("Camera scanning is unavailable. Paste the key instead.");
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [pushToast, scannerOpen]);

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">Add friend with key</h2>
          <p className="text-xs text-muted-foreground">Paste or scan a WayPoint access key someone shared with you.</p>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmedToken.length > 0) {
            mutation.mutate(trimmedToken);
          }
        }}
      >
        <label className="sr-only" htmlFor="share-token">
          Access key
        </label>
        <input
          id="share-token"
          value={shareToken}
          onChange={(event) => setShareToken(event.target.value)}
          placeholder="Paste access key"
          autoComplete="off"
          spellCheck={false}
          className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-white px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="button" variant="secondary" onClick={() => setScannerOpen(true)}>
          <Camera className="h-4 w-4" />
          Scan
        </Button>
        <Button type="submit" disabled={mutation.isPending || trimmedToken.length === 0}>
          <Plus className="h-4 w-4" />
          {mutation.isPending ? "Adding" : "Add friend"}
        </Button>
      </form>

      {scannerOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-md border border-border bg-white shadow-panel">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 className="text-sm font-semibold">Scan access key</h2>
                <p className="text-xs text-muted-foreground">Point the camera at a WayPoint QR code.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close scanner" onClick={() => setScannerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-black p-3">
              <video ref={videoRef} className="aspect-square w-full rounded-md bg-black object-cover" muted playsInline />
            </div>

            {scannerError ? (
              <p className="border-t border-border bg-amber-50 p-4 text-sm text-amber-900">{scannerError}</p>
            ) : (
              <p className="border-t border-border p-4 text-sm text-muted-foreground">Camera access is used only while this scanner is open.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function normalizeScannedKey(value: string): string {
  try {
    const url = new URL(value);
    const joinIndex = url.pathname.split("/").findIndex((part) => part === "join");
    const token = joinIndex >= 0 ? url.pathname.split("/")[joinIndex + 1] : null;
    if (token) {
      return decodeURIComponent(token);
    }
  } catch {
    // Not a URL; use the raw scanned key.
  }

  return value;
}
