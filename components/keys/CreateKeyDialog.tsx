"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AccessKeyQrCode } from "@/components/keys/AccessKeyQrCode";
import { createKey } from "@/lib/client-api";
import type { CreatedKeyResponse } from "@/lib/api-types";
import { useUiStore } from "@/store/ui-store";

export function CreateKeyDialog() {
  const [keyLabel, setKeyLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [created, setCreated] = useState<CreatedKeyResponse | null>(null);
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const mutation = useMutation({
    mutationFn: createKey,
    onSuccess: (result) => {
      setCreated(result);
      setKeyLabel("");
      setExpiresAt("");
      void queryClient.invalidateQueries({ queryKey: ["keys"] });
      pushToast({ type: "success", title: "Access key created", description: "Copy the key now; it is shown once." });
    },
    onError: (error) => {
      pushToast({ type: "error", title: "Could not create key", description: error.message });
    }
  });

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold">Create access key</h2>
      </div>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ keyLabel, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null });
        }}
      >
        <label className="grid gap-1 text-sm font-medium">
          Label
          <input
            value={keyLabel}
            onChange={(event) => setKeyLabel(event.target.value)}
            placeholder="For family"
            required
            maxLength={80}
            className="min-h-10 rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Optional expiry
          <input
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            type="datetime-local"
            className="min-h-10 rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <Button type="submit" disabled={mutation.isPending || keyLabel.trim().length === 0}>
          <Plus className="h-4 w-4" />
          {mutation.isPending ? "Creating" : "Create key"}
        </Button>
      </form>

      {created ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-950">One-time access key</p>
          <p className="mt-1 text-xs text-emerald-900">
            Share this key or QR code with a trusted person. It is never stored raw and will not be shown again.
          </p>
          <AccessKeyQrCode shareToken={created.shareToken} />
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={created.shareToken}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 font-mono text-sm"
            />
            <Button
              type="button"
              size="icon"
              aria-label="Copy access key"
              onClick={() => {
                void navigator.clipboard.writeText(created.shareToken);
                pushToast({ type: "success", title: "Copied access key" });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
