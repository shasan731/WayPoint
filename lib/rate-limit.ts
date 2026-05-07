import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitKind = "locationUpdate" | "keyCreate" | "joinConnection";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const memoryHits = new Map<string, number[]>();

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}

function createLimiter(kind: RateLimitKind, redis: Redis) {
  switch (kind) {
    case "locationUpdate":
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "waypoint:rl:location"
      });
    case "keyCreate":
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "waypoint:rl:key"
      });
    case "joinConnection":
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        prefix: "waypoint:rl:join"
      });
  }
}

function memoryLimit(kind: RateLimitKind, identifier: string): RateLimitResult {
  const config =
    kind === "locationUpdate"
      ? { limit: 10, windowMs: 60_000 }
      : kind === "keyCreate"
        ? { limit: 10, windowMs: 3_600_000 }
        : { limit: 20, windowMs: 3_600_000 };

  const key = `${kind}:${identifier}`;
  const now = Date.now();
  const hits = (memoryHits.get(key) ?? []).filter((hit) => now - hit < config.windowMs);
  hits.push(now);
  memoryHits.set(key, hits);

  return {
    success: hits.length <= config.limit,
    limit: config.limit,
    remaining: Math.max(config.limit - hits.length, 0),
    reset: now + config.windowMs
  };
}

export async function checkRateLimit(kind: RateLimitKind, identifier: string): Promise<RateLimitResult> {
  const redis = getRedis();

  if (!redis) {
    return memoryLimit(kind, identifier);
  }

  return createLimiter(kind, redis).limit(identifier);
}
