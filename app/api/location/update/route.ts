import { eq } from "drizzle-orm";
import { isResponse, jsonError, jsonOk, readJson, requireApiUser, validationError } from "@/lib/api";
import { withDbRetry } from "@/lib/db";
import { locationCurrent, locationHistory, users } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { locationUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  const rateLimit = await checkRateLimit("locationUpdate", user.id);
  if (!rateLimit.success) {
    return jsonError(429, "Rate limit exceeded. Try again later.");
  }

  const payload = locationUpdateSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return validationError(payload.error);
  }

  const now = new Date();

  try {
    const result = await withDbRetry(async (database) => {
      const [profile] = await database
        .update(users)
        .set({ lastSeenAt: now, updatedAt: now })
        .where(eq(users.id, user.id))
        .returning({ allowLocationHistory: users.allowLocationHistory });

      await database
        .insert(locationCurrent)
        .values({
          userId: user.id,
          lat: payload.data.lat,
          lng: payload.data.lng,
          accuracy: payload.data.accuracy,
          altitude: payload.data.altitude,
          heading: payload.data.heading,
          speed: payload.data.speed,
          batteryLevel: payload.data.batteryLevel,
          isCharging: payload.data.isCharging,
          lastUpdated: now
        })
        .onConflictDoUpdate({
          target: locationCurrent.userId,
          set: {
            lat: payload.data.lat,
            lng: payload.data.lng,
            accuracy: payload.data.accuracy,
            altitude: payload.data.altitude,
            heading: payload.data.heading,
            speed: payload.data.speed,
            batteryLevel: payload.data.batteryLevel,
            isCharging: payload.data.isCharging,
            source: "browser-geolocation",
            lastUpdated: now
          }
        });

      if (profile?.allowLocationHistory) {
        await database.insert(locationHistory).values({
          userId: user.id,
          lat: payload.data.lat,
          lng: payload.data.lng,
          accuracy: payload.data.accuracy,
          batteryLevel: payload.data.batteryLevel,
          recordedAt: now
        });
      }

      return now;
    });

    return jsonOk({ ok: true, lastUpdated: result.toISOString() });
  } catch {
    return jsonError(500, "Unable to update location right now.");
  }
}
