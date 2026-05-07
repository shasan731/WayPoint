import { desc, eq } from "drizzle-orm";
import { isResponse, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { withDbRetry } from "@/lib/db";
import { accessKeys, connections, users } from "@/lib/db/schema";

export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  try {
    const [following, followers] = await withDbRetry(async (database) =>
      Promise.all([
        database
          .select({
            connectionId: connections.id,
            status: connections.status,
            grantedAt: connections.grantedAt,
            owner: {
              id: users.id,
              name: users.name,
              image: users.image
            },
            accessKey: {
              id: accessKeys.id,
              label: accessKeys.keyLabel,
              isActive: accessKeys.isActive,
              isMuted: accessKeys.isMuted
            }
          })
          .from(connections)
          .innerJoin(users, eq(connections.ownerId, users.id))
          .innerJoin(accessKeys, eq(connections.accessKeyId, accessKeys.id))
          .where(eq(connections.followerId, user.id))
          .orderBy(desc(connections.grantedAt)),
        database
          .select({
            connectionId: connections.id,
            status: connections.status,
            grantedAt: connections.grantedAt,
            follower: {
              id: users.id,
              name: users.name,
              image: users.image
            },
            accessKey: {
              id: accessKeys.id,
              label: accessKeys.keyLabel,
              isActive: accessKeys.isActive,
              isMuted: accessKeys.isMuted
            }
          })
          .from(connections)
          .innerJoin(users, eq(connections.followerId, users.id))
          .innerJoin(accessKeys, eq(connections.accessKeyId, accessKeys.id))
          .where(eq(connections.ownerId, user.id))
          .orderBy(desc(connections.grantedAt))
      ])
    );

    return jsonOk({
      following: following.map((item) => ({ ...item, grantedAt: item.grantedAt.toISOString() })),
      followers: followers.map((item) => ({ ...item, grantedAt: item.grantedAt.toISOString() }))
    });
  } catch {
    return jsonError(500, "Unable to load connections.");
  }
}
