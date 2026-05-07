import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { updateSettings } from "@/lib/client-api";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn()
}));

vi.mock("@/lib/client-api", () => ({
  fetchSettings: vi.fn().mockResolvedValue({
    item: {
      id: "user-id",
      name: null,
      email: "test@example.com",
      image: null,
      globalGhostMode: false,
      shareBattery: false,
      allowLocationHistory: false,
      lastSeenAt: null
    }
  }),
  updateSettings: vi.fn().mockResolvedValue({ item: { globalGhostMode: true, shareBattery: false, allowLocationHistory: false } })
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("SettingsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists ghost mode toggle changes", async () => {
    renderWithQueryClient(<SettingsPanel />);

    const toggle = await screen.findByLabelText("Toggle Ghost mode");
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(vi.mocked(updateSettings).mock.calls[0]?.[0]).toEqual({ globalGhostMode: true });
    });
  });
});
