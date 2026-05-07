"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing, CalendarClock, Edit3, Power, Trash2, Users } from "lucide-react";
import { useState } from "react";
import type { AccessKeyItem } from "@/lib/api-types";
import { deactivateKey, updateKey } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatRelativeTime } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export function KeyCard({ item }: { item: AccessKeyItem }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.keyLabel);
  const [now] = useState(() => Date.now());
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["keys"] });

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateKey>[1]) => updateKey(item.id, input),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      pushToast({ type: "success", title: "Access key updated" });
    },
    onError: (error) => pushToast({ type: "error", title: "Update failed", description: error.message })
  });

  const deleteMutation = useMutation({
    mutationFn: () => deactivateKey(item.id),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", title: "Access key deactivated" });
    },
    onError: (error) => pushToast({ type: "error", title: "Deactivate failed", description: error.message })
  });

  const expired = item.expiresAt ? new Date(item.expiresAt).getTime() <= now : false;

  return (
    <article className="rounded-md border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate({ keyLabel: label });
              }}
            >
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="min-h-10 min-w-0 flex-1 rounded-md border border-input px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                maxLength={80}
              />
              <Button size="sm" disabled={updateMutation.isPending || label.trim().length === 0}>
                Save
              </Button>
            </form>
          ) : (
            <>
              <h3 className="truncate text-sm font-semibold">{item.keyLabel}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {item.followerCount} followers
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Last used {formatRelativeTime(item.lastUsedAt)}
                </span>
              </div>
            </>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Rename key" onClick={() => setEditing(!editing)}>
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 grid gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Muted</p>
            <p className="text-xs text-muted-foreground">Followers through this key receive no location.</p>
          </div>
          <Switch
            label="Toggle muted state"
            checked={item.isMuted}
            onCheckedChange={(checked) => updateMutation.mutate({ isMuted: checked })}
            disabled={updateMutation.isPending}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">Inactive keys deny new and existing access.</p>
          </div>
          <Switch
            label="Toggle active state"
            checked={item.isActive}
            onCheckedChange={(checked) => updateMutation.mutate({ isActive: checked })}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.isMuted ? <BellOff className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}
          {expired ? "Expired" : item.expiresAt ? `Expires ${new Date(item.expiresAt).toLocaleString()}` : "No expiry"}
        </span>
        <div className="flex gap-2">
          {!item.isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700">
              <Power className="h-3 w-3" />
              Inactive
            </span>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending || !item.isActive}
            onClick={() => {
              if (window.confirm("Deactivate this access key? Existing followers will lose access immediately.")) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Deactivate
          </Button>
        </div>
      </div>
    </article>
  );
}
