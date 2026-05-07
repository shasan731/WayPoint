"use client";

import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { CreateKeyDialog } from "@/components/keys/CreateKeyDialog";
import { KeyCard } from "@/components/keys/KeyCard";
import { fetchKeys } from "@/lib/client-api";

function KeySkeleton() {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="h-4 w-44 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-60 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-10 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function KeyManager() {
  const keys = useQuery({
    queryKey: ["keys"],
    queryFn: fetchKeys
  });

  return (
    <section id="keys" className="grid gap-4">
      <CreateKeyDialog />

      <section className="rounded-md border border-border bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">My access keys</h2>
            <p className="text-xs text-muted-foreground">Raw tokens are never returned after creation.</p>
          </div>
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>

        {keys.isLoading ? (
          <div className="grid gap-3">
            <KeySkeleton />
            <KeySkeleton />
          </div>
        ) : keys.data?.items.length ? (
          <div className="grid gap-3">
            {keys.data.items.map((item) => (
              <KeyCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/50 p-5 text-center">
            <KeyRound className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No keys created</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a key to let a trusted person request access.</p>
          </div>
        )}
      </section>
    </section>
  );
}
