import { describe, expect, it } from "vitest";
import { resolveLocationVisibility } from "@/lib/privacy";

const base = {
  owner: { globalGhostMode: false },
  accessKey: { isActive: true, isMuted: false, expiresAt: null },
  connection: { status: "active" as const },
  location: { lastUpdated: new Date("2026-05-07T00:00:00.000Z") },
  now: new Date("2026-05-07T01:00:00.000Z")
};

describe("resolveLocationVisibility", () => {
  it("allows active connections with a valid key and location", () => {
    expect(resolveLocationVisibility(base)).toEqual({ canView: true, status: "active" });
  });

  it("hides when ghost mode is enabled", () => {
    expect(resolveLocationVisibility({ ...base, owner: { globalGhostMode: true } })).toEqual({
      canView: false,
      status: "hiddenByPrivacy"
    });
  });

  it("hides muted keys", () => {
    expect(resolveLocationVisibility({ ...base, accessKey: { ...base.accessKey, isMuted: true } })).toEqual({
      canView: false,
      status: "muted"
    });
  });

  it("denies inactive and expired keys before other privacy states", () => {
    expect(resolveLocationVisibility({ ...base, accessKey: { ...base.accessKey, isActive: false } })).toEqual({
      canView: false,
      status: "inactiveKey"
    });
    expect(
      resolveLocationVisibility({
        ...base,
        accessKey: { ...base.accessKey, expiresAt: new Date("2026-05-06T23:59:00.000Z") }
      })
    ).toEqual({ canView: false, status: "expiredKey" });
  });

  it("denies revoked or blocked connections", () => {
    expect(resolveLocationVisibility({ ...base, connection: { status: "revoked" } })).toEqual({
      canView: false,
      status: "revoked"
    });
    expect(resolveLocationVisibility({ ...base, connection: { status: "blocked" } })).toEqual({
      canView: false,
      status: "revoked"
    });
  });

  it("reports noLocation when privacy allows access but no point exists", () => {
    expect(resolveLocationVisibility({ ...base, location: null })).toEqual({
      canView: false,
      status: "noLocation"
    });
  });
});
