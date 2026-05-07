import { eq } from "drizzle-orm";
import { isResponse, jsonError, jsonOk, readJson, requireApiUser, validationError } from "@/lib/api";
import { withDbRetry } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { settingsUpdateSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  try {
    const [settings] = await withDbRetry((database) =>
      database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          globalGhostMode: users.globalGhostMode,
          shareBattery: users.shareBattery,
          allowLocationHistory: users.allowLocationHistory,
          lastSeenAt: users.lastSeenAt
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
    );

    if (!settings) {
      return jsonError(404, "User not found.");
    }

    return jsonOk({
      item: {
        ...settings,
        lastSeenAt: settings.lastSeenAt?.toISOString() ?? null
      }
    });
  } catch {
    return jsonError(500, "Unable to load settings.");
  }
}

export async function PATCH(request: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  const payload = settingsUpdateSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return validationError(payload.error);
  }

  try {
    const [updated] = await withDbRetry((database) =>
      database
        .update(users)
        .set({ ...payload.data, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning({
          globalGhostMode: users.globalGhostMode,
          shareBattery: users.shareBattery,
          allowLocationHistory: users.allowLocationHistory
        })
    );

    if (!updated) {
      return jsonError(404, "User not found.");
    }

    return jsonOk({ item: updated });
  } catch {
    return jsonError(500, "Unable to update settings.");
  }
}
