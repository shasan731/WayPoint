import { describe, expect, it } from "vitest";
import { createKeySchema, locationUpdateSchema, settingsUpdateSchema } from "@/lib/validators";

describe("locationUpdateSchema", () => {
  it("accepts valid browser location payloads", () => {
    const parsed = locationUpdateSchema.parse({
      lat: 23.8103,
      lng: 90.4125,
      accuracy: 12,
      batteryLevel: 87,
      isCharging: false
    });

    expect(parsed.altitude).toBeNull();
    expect(parsed.heading).toBeNull();
    expect(parsed.speed).toBeNull();
  });

  it("rejects impossible coordinates and battery values", () => {
    expect(() => locationUpdateSchema.parse({ lat: 91, lng: 0, batteryLevel: 50 })).toThrow();
    expect(() => locationUpdateSchema.parse({ lat: 0, lng: 181, batteryLevel: 50 })).toThrow();
    expect(() => locationUpdateSchema.parse({ lat: 0, lng: 0, batteryLevel: 101 })).toThrow();
  });
});

describe("key and settings validators", () => {
  it("sanitizes labels and parses expiry", () => {
    const parsed = createKeySchema.parse({ keyLabel: "  Family\nKey  ", expiresAt: "2026-05-08T00:00:00.000Z" });
    expect(parsed.keyLabel).toBe("Family Key");
    expect(parsed.expiresAt).toBeInstanceOf(Date);
  });

  it("requires at least one settings field", () => {
    expect(settingsUpdateSchema.safeParse({}).success).toBe(false);
    expect(settingsUpdateSchema.safeParse({ globalGhostMode: true }).success).toBe(true);
  });
});
