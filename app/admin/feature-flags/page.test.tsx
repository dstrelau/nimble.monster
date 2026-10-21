import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  getFeatureFlagUsers: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/lib/services/featureFlags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/featureFlags")>()),
  getFeatureFlagUsers: mocks.getFeatureFlagUsers,
}));
vi.mock("@/components/shared/search-creators-action", () => ({
  searchCreators: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("Not found");
  },
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { FEATURE_FLAGS } from "@/lib/services/featureFlags";
import FeatureFlagsPage from "./page";

const empty = Object.fromEntries(FEATURE_FLAGS.map((f) => [f, []]));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.getFeatureFlagUsers.mockResolvedValue(empty);
});
afterEach(cleanup);

it("hides administration from non-admins", async () => {
  mocks.isAdmin.mockResolvedValue(false);
  await expect(FeatureFlagsPage()).rejects.toThrow("Not found");
  expect(mocks.getFeatureFlagUsers).not.toHaveBeenCalled();
});

it("shows every registered flag with its enabled users and an add control", async () => {
  mocks.getFeatureFlagUsers.mockResolvedValue({
    ...empty,
    "monster-statblock-editor": [
      { id: "u1", username: "dev", displayName: "Dev User", discordId: "1" },
    ],
  });
  render(await FeatureFlagsPage());
  for (const feature of FEATURE_FLAGS) {
    expect(
      screen.getByRole("combobox", { name: `Add user to ${feature}` })
    ).toBeInTheDocument();
  }
  const card = screen
    .getByRole("combobox", { name: "Add user to monster-statblock-editor" })
    .closest("[data-slot='card']");
  expect(card).not.toBeNull();
  expect(
    within(card as HTMLElement).getByRole("button", {
      name: "Remove @dev from monster-statblock-editor",
    })
  ).toBeInTheDocument();
  expect(screen.getAllByText("No users have this flag.")).toHaveLength(
    FEATURE_FLAGS.length - 1
  );
});
