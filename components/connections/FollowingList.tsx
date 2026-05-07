"use client";

import { UsersRound, WifiOff } from "lucide-react";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { useFollowingQuery } from "@/lib/use-following-query";

function SkeletonCard() {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-5 h-3 w-52 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function FollowingList({ compact = false }: { compact?: boolean }) {
  const { query: following, online } = useFollowingQuery();

  if (!online) {
    return (
      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <WifiOff className="h-4 w-4" />
          Offline
        </div>
        <p className="mt-1">Polling is paused until the network returns.</p>
      </section>
    );
  }

  return (
    <section className={compact ? "" : "rounded-md border border-border bg-white p-4"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Following</h2>
          <p className="text-xs text-muted-foreground">Live locations you are allowed to view</p>
        </div>
        <UsersRound className="h-5 w-5 text-muted-foreground" />
      </div>

      {following.isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard />
          {!compact ? <SkeletonCard /> : null}
        </div>
      ) : following.data?.items.length ? (
        <div className="grid gap-3">
          {following.data.items.map((item) => (
            <ConnectionCard key={item.connectionId} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-muted/50 p-5 text-center">
          <UsersRound className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No followed locations</p>
          <p className="mt-1 text-sm text-muted-foreground">Join with someone else&apos;s share key to see them here.</p>
        </div>
      )}
    </section>
  );
}
