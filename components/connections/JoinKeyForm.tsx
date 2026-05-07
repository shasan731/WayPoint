"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinConnection } from "@/lib/client-api";
import { useUiStore } from "@/store/ui-store";

export function JoinKeyForm() {
  const [shareToken, setShareToken] = useState("");
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

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">Add friend with key</h2>
          <p className="text-xs text-muted-foreground">Paste a WayPoint access key someone shared with you.</p>
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
        <Button type="submit" disabled={mutation.isPending || trimmedToken.length === 0}>
          <Plus className="h-4 w-4" />
          {mutation.isPending ? "Adding" : "Add friend"}
        </Button>
      </form>
    </section>
  );
}
