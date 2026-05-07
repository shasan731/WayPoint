import type { ConnectionStatus } from "@/lib/db/schema";

export type VisibilityStatus =
  | "active"
  | "hiddenByPrivacy"
  | "muted"
  | "inactiveKey"
  | "expiredKey"
  | "revoked"
  | "noLocation";

export type VisibilityOwner = {
  globalGhostMode: boolean;
};

export type VisibilityAccessKey = {
  isActive: boolean;
  isMuted: boolean;
  expiresAt: Date | null;
};

export type VisibilityConnection = {
  status: ConnectionStatus;
};

export type VisibilityLocation = {
  lastUpdated: Date;
} | null;

export function resolveLocationVisibility({
  owner,
  accessKey,
  connection,
  location,
  now = new Date()
}: {
  owner: VisibilityOwner;
  accessKey: VisibilityAccessKey;
  connection: VisibilityConnection;
  location: VisibilityLocation;
  now?: Date;
}): { canView: boolean; status: VisibilityStatus } {
  if (connection.status !== "active") {
    return { canView: false, status: "revoked" };
  }

  if (!accessKey.isActive) {
    return { canView: false, status: "inactiveKey" };
  }

  if (accessKey.expiresAt && accessKey.expiresAt.getTime() <= now.getTime()) {
    return { canView: false, status: "expiredKey" };
  }

  if (accessKey.isMuted) {
    return { canView: false, status: "muted" };
  }

  if (owner.globalGhostMode) {
    return { canView: false, status: "hiddenByPrivacy" };
  }

  if (!location) {
    return { canView: false, status: "noLocation" };
  }

  return { canView: true, status: "active" };
}
