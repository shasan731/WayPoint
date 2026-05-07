import { describe, expect, it } from "vitest";
import { generateShareToken, hashShareToken, safeTokenHashEquals } from "@/lib/crypto";

describe("share token crypto", () => {
  it("generates non-trivial random tokens", () => {
    const first = generateShareToken();
    const second = generateShareToken();

    expect(first).toHaveLength(43);
    expect(second).toHaveLength(43);
    expect(first).not.toBe(second);
  });

  it("hashes the same token deterministically with HMAC-SHA256", () => {
    const secret = "test-secret-with-enough-entropy";
    const hash = hashShareToken("share-token", secret);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashShareToken("share-token", secret));
    expect(hash).not.toBe(hashShareToken("different-token", secret));
    expect(safeTokenHashEquals(hash, hashShareToken("share-token", secret))).toBe(true);
    expect(safeTokenHashEquals(hash, hashShareToken("different-token", secret))).toBe(false);
  });
});
