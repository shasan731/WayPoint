import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { requireCurrentUser } from "@/lib/auth";

export type ApiUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      ok: false,
      error: "Invalid request payload.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    },
    { status: 400 }
  );
}

export async function requireApiUser(): Promise<ApiUser | Response> {
  const user = await requireCurrentUser();
  if (!user?.id) {
    return jsonError(401, "Authentication required.");
  }
  return user;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
