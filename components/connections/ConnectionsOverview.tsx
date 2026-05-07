"use client";

import { useQuery } from "@tanstack/react-query";
import { UserCheck, UsersRound } from "lucide-react";
import { fetchConnections } from "@/lib/client-api";
import { formatRelativeTime } from "@/lib/utils";

export function ConnectionsOverview() {
  const connections = useQuery({
    queryKey: ["connections"],
    queryFn: fetchConnections
  });

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Connections</h2>
          <p className="text-xs text-muted-foreground">People following you and people you follow</p>
        </div>
        <UsersRound className="h-5 w-5 text-muted-foreground" />
      </div>

      {connections.isLoading ? (
        <div className="mt-4 grid gap-2">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5" />
              Following
            </h3>
            <div className="mt-2 grid gap-2">
              {connections.data?.following.length ? (
                connections.data.following.map((item) => (
                  <div key={item.connectionId} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium">{item.owner.name ?? "Unnamed contact"}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.accessKey.label} · {item.status} · {formatRelativeTime(item.grantedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No following connections.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <UsersRound className="h-3.5 w-3.5" />
              Followers
            </h3>
            <div className="mt-2 grid gap-2">
              {connections.data?.followers.length ? (
                connections.data.followers.map((item) => (
                  <div key={item.connectionId} className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium">{item.follower.name ?? "Unnamed follower"}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.accessKey.label} · {item.status} · {formatRelativeTime(item.grantedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No followers yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
