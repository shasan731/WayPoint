import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KeyManager } from "@/components/keys/KeyManager";

vi.mock("@/lib/client-api", () => ({
  fetchKeys: vi.fn().mockResolvedValue({ items: [] }),
  createKey: vi.fn(),
  updateKey: vi.fn(),
  deactivateKey: vi.fn()
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("KeyManager", () => {
  it("renders the empty state and creation form", async () => {
    renderWithQueryClient(<KeyManager />);

    expect(screen.getByLabelText("Label")).toBeInTheDocument();
    expect(await screen.findByText("No keys created")).toBeInTheDocument();
  });
});
