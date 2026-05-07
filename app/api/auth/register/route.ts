import { eq } from "drizzle-orm";
import { jsonError, jsonOk, readJson, validationError } from "@/lib/api";
import { withDbRetry } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return validationError(payload.error);
  }

  try {
    const now = new Date();
    const passwordHash = await hashPassword(payload.data.password);

    const result = await withDbRetry(async (database) => {
      const [existing] = await database
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, payload.data.email))
        .limit(1);

      if (existing) {
        return { status: "exists" as const };
      }

      const [created] = await database
        .insert(users)
        .values({
          name: payload.data.name,
          email: payload.data.email,
          passwordHash,
          createdAt: now,
          updatedAt: now
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email
        });

      return { status: "created" as const, user: created };
    });

    if (result.status === "exists") {
      return jsonError(409, "An account with this email already exists.");
    }

    return jsonOk({ ok: true, user: result.user }, { status: 201 });
  } catch {
    return jsonError(500, "Unable to create account.");
  }
}
