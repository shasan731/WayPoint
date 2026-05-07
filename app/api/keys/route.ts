import { and, count, desc, eq } from "drizzle-orm";
import { isResponse, jsonError, jsonOk, readJson, requireApiUser, validationError } from "@/lib/api";
import { generateShareToken, hashShareToken } from "@/lib/crypto";
import { withDbRetry } from "@/lib/db";
import { accessKeys, connections } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { createKeySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  try {
    const items = await withDbRetry((database) =>
      database
        .select({
          id: accessKeys.id,
          keyLabel: accessKeys.keyLabel,
          isActive: accessKeys.isActive,
          isMuted: accessKeys.isMuted,
          expiresAt: accessKeys.expiresAt,
          lastUsedAt: accessKeys.lastUsedAt,
          createdAt: accessKeys.createdAt,
          updatedAt: accessKeys.updatedAt,
          followerCount: count(connections.id)
        })
        .from(accessKeys)
        .leftJoin(
          connections,
          and(eq(connections.accessKeyId, accessKeys.id), eq(connections.status, "active"))
        )
        .where(eq(accessKeys.ownerId, user.id))
        .groupBy(
          accessKeys.id,
          accessKeys.keyLabel,
          accessKeys.isActive,
          accessKeys.isMuted,
          accessKeys.expiresAt,
          accessKeys.lastUsedAt,
          accessKeys.createdAt,
          accessKeys.updatedAt
        )
        .orderBy(desc(accessKeys.createdAt))
    );

    return jsonOk({
      items: items.map((item) => ({
        ...item,
        expiresAt: item.expiresAt?.toISOString() ?? null,
        lastUsedAt: item.lastUsedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }))
    });
  } catch {
    return jsonError(500, "Unable to load access keys.");
  }
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) {
    return user;
  }

  const rateLimit = await checkRateLimit("keyCreate", user.id);
  if (!rateLimit.success) {
    return jsonError(429, "Rate limit exceeded. Try again later.");
  }

  const payload = createKeySchema.safeParse(await readJson(request));
  if (!payload.success) {
    return validationError(payload.error);
  }

  try {
    const shareToken = generateShareToken();
    const tokenHash = hashShareToken(shareToken);
    const [created] = await withDbRetry((database) =>
      database
        .insert(accessKeys)
        .values({
          ownerId: user.id,
          keyLabel: payload.data.keyLabel,
          tokenHash,
          expiresAt: payload.data.expiresAt
        })
        .returning({
          id: accessKeys.id,
          keyLabel: accessKeys.keyLabel
        })
    );

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    return jsonOk(
      {
        id: created.id,
        keyLabel: created.keyLabel,
        shareToken,
        shareUrl: `${origin}/join/${shareToken}`
      },
      { status: 201 }
    );
  } catch {
    return jsonError(500, "Unable to create access key.");
  }
}
