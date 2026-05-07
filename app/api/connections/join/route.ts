import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { isResponse, jsonError, jsonOk, readJson, requireApiUser, validationError } from "@/lib/api";
import { hashShareToken } from "@/lib/crypto";
import { withDbRetry } from "@/lib/db";
import { accessKeys, connections } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { joinConnectionSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit("joinConnection", `${user.id}:${ip}`);
  if (!rateLimit.success) {
    return jsonError(429, "Rate limit exceeded. Try again later.");
  }

  const payload = joinConnectionSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return validationError(payload.error);
  }

  try {
    const tokenHash = hashShareToken(payload.data.shareToken);
    const now = new Date();

    const result = await withDbRetry(async (database) => {
      const [key] = await database
        .select()
        .from(accessKeys)
        .where(eq(accessKeys.tokenHash, tokenHash))
        .limit(1);

      if (!key || !key.isActive || key.isMuted || (key.expiresAt && key.expiresAt <= now)) {
        return { status: 403 as const };
      }

      if (key.ownerId === user.id) {
        return { status: 400 as const };
      }

      await database.update(accessKeys).set({ lastUsedAt: now, updatedAt: now }).where(eq(accessKeys.id, key.id));

      const [existing] = await database
        .select()
        .from(connections)
        .where(and(eq(connections.followerId, user.id), eq(connections.accessKeyId, key.id)))
        .limit(1);

      if (existing?.status === "blocked") {
        return { status: 403 as const };
      }

      if (existing) {
        if (existing.status !== "active") {
          const [reactivated] = await database
            .update(connections)
            .set({ status: "active", revokedAt: null, grantedAt: now })
            .where(eq(connections.id, existing.id))
            .returning({ id: connections.id });
          return { status: 200 as const, connectionId: reactivated.id };
        }
        return { status: 200 as const, connectionId: existing.id };
      }

      const [created] = await database
        .insert(connections)
        .values({
          followerId: user.id,
          ownerId: key.ownerId,
          accessKeyId: key.id
        })
        .returning({ id: connections.id });

      return { status: 201 as const, connectionId: created.id };
    });

    if (result.status === 400) {
      return jsonError(400, "You cannot follow yourself.");
    }

    if (result.status === 403) {
      return jsonError(403, "This share link is unavailable.");
    }

    return jsonOk({ ok: true, connectionId: result.connectionId }, { status: result.status });
  } catch {
    return jsonError(500, "Unable to join this connection.");
  }
}
