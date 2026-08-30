import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockIsFeatureFlagEnabled, mockNotFound } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsFeatureFlagEnabled: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mockIsFeatureFlagEnabled,
}));
vi.mock("next/navigation", () => ({ notFound: mockNotFound }));
vi.mock("./NewRandomTableClient", () => ({
  NewRandomTable: () => <div>New random table form</div>,
}));

import NewRandomTablePage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NewRandomTablePage", () => {
  it("returns not found when the feature is disabled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockIsFeatureFlagEnabled.mockResolvedValue(false);

    await expect(NewRandomTablePage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("renders when the feature is enabled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockIsFeatureFlagEnabled.mockResolvedValue(true);

    render(await NewRandomTablePage());

    expect(screen.getByText("New random table form")).toBeInTheDocument();
  });
});
