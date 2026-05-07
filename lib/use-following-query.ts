"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchFollowing } from "@/lib/client-api";

export function useFollowingQuery({ enabled = true }: { enabled?: boolean } = {}) {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [hidden, setHidden] = useState(() => (typeof document === "undefined" ? false : document.hidden));

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onVisibility = () => setHidden(document.hidden);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const query = useQuery({
    queryKey: ["following"],
    queryFn: fetchFollowing,
    enabled: enabled && online,
    refetchInterval: online ? (hidden ? 60_000 : 10_000) : false
  });

  return { query, online, hidden };
}
