import { jsonError, jsonOk } from "@/lib/api";
import { pingDb } from "@/lib/db";

export async function GET() {
  try {
    await pingDb();
    return jsonOk({ ok: true });
  } catch {
    return jsonError(503, "Database is unavailable.");
  }
}
