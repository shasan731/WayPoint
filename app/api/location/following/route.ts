import { desc, eq } from "drizzle-orm";
import { isResponse, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { withDbRetry } from "@/lib/db";
import { accessKeys, connections, locationCurrent, users } from "@/lib/db/schema";
import { resolveLocationVisibility } from "@/lib/privacy";

export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  try {
    const rows = await withDbRetry((database) =>
      database
        .select({
          connection: {
            id: connections.id,
            status: connections.status
          },
          owner: {
            id: users.id,
            name: users.name,
            image: users.image,
            globalGhostMode: users.globalGhostMode,
            shareBattery: users.shareBattery
          },
          accessKey: {
            label: accessKeys.keyLabel,
            isActive: accessKeys.isActive,
            isMuted: accessKeys.isMuted,
            expiresAt: accessKeys.expiresAt
          },
          location: {
            lat: locationCurrent.lat,
            lng: locationCurrent.lng,
            accuracy: locationCurrent.accuracy,
            altitude: locationCurrent.altitude,
            heading: locationCurrent.heading,
            speed: locationCurrent.speed,
            batteryLevel: locationCurrent.batteryLevel,
            isCharging: locationCurrent.isCharging,
            lastUpdated: locationCurrent.lastUpdated
          }
        })
        .from(connections)
        .innerJoin(users, eq(connections.ownerId, users.id))
        .innerJoin(accessKeys, eq(connections.accessKeyId, accessKeys.id))
        .leftJoin(locationCurrent, eq(locationCurrent.userId, connections.ownerId))
        .where(eq(connections.followerId, user.id))
        .orderBy(desc(connections.grantedAt))
    );

    return jsonOk({
      items: rows.map((row) => {
        const visibility = resolveLocationVisibility({
          owner: row.owner,
          accessKey: row.accessKey,
          connection: row.connection,
          location: row.location?.lastUpdated ? { lastUpdated: row.location.lastUpdated } : null
        });

        const visibleLocation = visibility.canView && row.location ? row.location : null;

        return {
          connectionId: row.connection.id,
          owner: {
            id: row.owner.id,
            name: row.owner.name,
            image: row.owner.image
          },
          accessKey: {
            label: row.accessKey.label
          },
          location: visibleLocation
            ? {
                lat: visibleLocation.lat,
                lng: visibleLocation.lng,
                accuracy: visibleLocation.accuracy,
                altitude: visibleLocation.altitude,
                heading: visibleLocation.heading,
                speed: visibleLocation.speed,
                lastUpdated: visibleLocation.lastUpdated.toISOString()
              }
            : null,
          battery:
            visibleLocation && row.owner.shareBattery
              ? {
                  batteryLevel: visibleLocation.batteryLevel,
                  isCharging: visibleLocation.isCharging
                }
              : null,
          status: visibility.status
        };
      })
    });
  } catch {
    return jsonError(500, "Unable to load followed locations.");
  }
}
