import type {
  ConnectionListResponse,
  CreatedKeyResponse,
  FollowingResponse,
  KeysResponse,
  SettingsResponse
} from "@/lib/api-types";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }
  return payload;
}

export async function fetchFollowing(): Promise<FollowingResponse> {
  return parseResponse<FollowingResponse>(await fetch("/api/location/following", { cache: "no-store" }));
}

export async function fetchKeys(): Promise<KeysResponse> {
  return parseResponse<KeysResponse>(await fetch("/api/keys", { cache: "no-store" }));
}

export async function createKey(input: { keyLabel: string; expiresAt: string | null }): Promise<CreatedKeyResponse> {
  return parseResponse<CreatedKeyResponse>(
    await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function updateKey(
  keyId: string,
  input: Partial<{ keyLabel: string; isActive: boolean; isMuted: boolean; expiresAt: string | null }>
) {
  return parseResponse<{ item: unknown }>(
    await fetch(`/api/keys/${keyId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function deactivateKey(keyId: string) {
  return parseResponse<{ ok: true }>(
    await fetch(`/api/keys/${keyId}`, {
      method: "DELETE"
    })
  );
}

export async function joinConnection(shareToken: string) {
  return parseResponse<{ ok: true; connectionId: string }>(
    await fetch("/api/connections/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shareToken })
    })
  );
}

export async function fetchConnections(): Promise<ConnectionListResponse> {
  return parseResponse<ConnectionListResponse>(await fetch("/api/connections", { cache: "no-store" }));
}

export async function fetchSettings(): Promise<SettingsResponse> {
  return parseResponse<SettingsResponse>(await fetch("/api/settings", { cache: "no-store" }));
}

export async function updateSettings(input: Partial<SettingsResponse["item"]>) {
  return parseResponse<{ item: Pick<SettingsResponse["item"], "globalGhostMode" | "shareBattery" | "allowLocationHistory"> }>(
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}
