import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string, secret = process.env.ACCESS_KEY_SECRET): string {
  if (!secret || secret.length < 24) {
    throw new Error("ACCESS_KEY_SECRET must be configured with at least 24 characters.");
  }

  return createHmac("sha256", secret).update(token, "utf8").digest("hex");
}

export function safeTokenHashEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
