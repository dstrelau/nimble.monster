import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockIsFeatureFlagEnabled } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsFeatureFlagEnabled: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mockIsFeatureFlagEnabled,
}));

import CreatePage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreatePage random tables feature", () => {
  it("hides random tables when the feature is disabled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockIsFeatureFlagEnabled.mockResolvedValue(false);

    render(await CreatePage());

    expect(screen.queryByText("Random Table")).not.toBeInTheDocument();
  });

  it("shows random tables when the feature is enabled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockIsFeatureFlagEnabled.mockResolvedValue(true);

    render(await CreatePage());

    expect(screen.getByRole("link", { name: /Random Table/ })).toHaveAttribute(
      "href",
      "/random-tables/new"
    );
  });
});
