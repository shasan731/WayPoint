import type { VisibilityStatus } from "@/lib/privacy";

export type BatteryPayload = {
  batteryLevel: number | null;
  isCharging: boolean | null;
} | null;

export type LocationPayload = {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  lastUpdated: string;
} | null;

export type FollowingItem = {
  connectionId: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  accessKey: {
    label: string;
  };
  location: LocationPayload;
  battery: BatteryPayload;
  status: VisibilityStatus;
};

export type FollowingResponse = {
  items: FollowingItem[];
};

export type AccessKeyItem = {
  id: string;
  keyLabel: string;
  isActive: boolean;
  isMuted: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  followerCount: number;
};

export type KeysResponse = {
  items: AccessKeyItem[];
};

export type CreatedKeyResponse = {
  id: string;
  keyLabel: string;
  shareToken: string;
  shareUrl: string;
};

export type SettingsItem = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  globalGhostMode: boolean;
  shareBattery: boolean;
  allowLocationHistory: boolean;
  lastSeenAt: string | null;
};

export type SettingsResponse = {
  item: SettingsItem;
};

export type ConnectionListResponse = {
  following: Array<{
    connectionId: string;
    status: string;
    grantedAt: string;
    owner: { id: string; name: string | null; image: string | null };
    accessKey: { id: string; label: string; isActive: boolean; isMuted: boolean };
  }>;
  followers: Array<{
    connectionId: string;
    status: string;
    grantedAt: string;
    follower: { id: string; name: string | null; image: string | null };
    accessKey: { id: string; label: string; isActive: boolean; isMuted: boolean };
  }>;
};
