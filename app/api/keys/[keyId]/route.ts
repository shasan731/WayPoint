import { and, eq } from "drizzle-orm";
import { isResponse, jsonError, jsonOk, readJson, requireApiUser, validationError } from "@/lib/api";
import { withDbRetry } from "@/lib/db";
import { accessKeys } from "@/lib/db/schema";
import { updateKeySchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ keyId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  const payload = updateKeySchema.safeParse(await readJson(request));
  if (!payload.success) {
    return validationError(payload.error);
  }

  const { keyId } = await context.params;
  const now = new Date();

  try {
    const [updated] = await withDbRetry((database) =>
      database
        .update(accessKeys)
        .set({ ...payload.data, updatedAt: now })
        .where(and(eq(accessKeys.id, keyId), eq(accessKeys.ownerId, user.id)))
        .returning({
          id: accessKeys.id,
          keyLabel: accessKeys.keyLabel,
          isActive: accessKeys.isActive,
          isMuted: accessKeys.isMuted,
          expiresAt: accessKeys.expiresAt,
          updatedAt: accessKeys.updatedAt
        })
    );

    if (!updated) {
      return jsonError(404, "Access key not found.");
    }

    return jsonOk({
      item: {
        ...updated,
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString()
      }
    });
  } catch {
    return jsonError(500, "Unable to update access key.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  const { keyId } = await context.params;
  const now = new Date();

  try {
    const [updated] = await withDbRetry((database) =>
      database
        .update(accessKeys)
        .set({ isActive: false, updatedAt: now })
        .where(and(eq(accessKeys.id, keyId), eq(accessKeys.ownerId, user.id)))
        .returning({ id: accessKeys.id })
    );

    if (!updated) {
      return jsonError(404, "Access key not found.");
    }

    return jsonOk({ ok: true });
  } catch {
    return jsonError(500, "Unable to deactivate access key.");
  }
}
