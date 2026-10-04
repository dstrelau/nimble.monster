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

import ChangelogPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChangelogPage feature flags", () => {
  it("hides random tables when the feature is disabled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockIsFeatureFlagEnabled.mockResolvedValue(false);

    render(await ChangelogPage());

    expect(screen.queryByText("Add Reference Tables.")).not.toBeInTheDocument();
  });

  it("shows random tables when the feature is enabled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockIsFeatureFlagEnabled.mockResolvedValue(true);

    render(await ChangelogPage());

    expect(screen.getByText("Add Reference Tables.")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .slice(0, 2)
        .map((heading) => heading.textContent)
    ).toEqual(["4 October 2026", "30 September 2026"]);
  });
});
