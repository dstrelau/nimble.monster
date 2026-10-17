import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  searchUsers: vi.fn(),
  getUserByUsername: vi.fn(),
  getEnabledFeatureFlags: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/lib/db/user", () => ({
  searchUsers: mocks.searchUsers,
  getUserByUsername: mocks.getUserByUsername,
}));
vi.mock("@/lib/services/featureFlags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/featureFlags")>()),
  getEnabledFeatureFlags: mocks.getEnabledFeatureFlags,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("Not found");
  },
  useRouter: () => ({ refresh: vi.fn() }),
}));

import FeatureFlagsPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.searchUsers.mockResolvedValue([]);
  mocks.getUserByUsername.mockResolvedValue(null);
  mocks.getEnabledFeatureFlags.mockResolvedValue([]);
});
afterEach(cleanup);

it("hides administration from non-admins", async () => {
  mocks.isAdmin.mockResolvedValue(false);
  await expect(
    FeatureFlagsPage({ searchParams: Promise.resolve({}) })
  ).rejects.toThrow("Not found");
  expect(mocks.searchUsers).not.toHaveBeenCalled();
});

it("shows each registered flag and its persisted state for the selected user", async () => {
  const user = { id: "target", username: "dev", displayName: "Dev User" };
  mocks.searchUsers.mockResolvedValue([user]);
  mocks.getUserByUsername.mockResolvedValue(user);
  mocks.getEnabledFeatureFlags.mockResolvedValue(["monster-statblock-editor"]);
  render(
    await FeatureFlagsPage({
      searchParams: Promise.resolve({ q: "dev", username: "dev" }),
    })
  );
  expect(screen.getByRole("link", { name: "Dev User (@dev)" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  expect(
    screen.getByRole("button", { name: "Enable class-draft-autosave" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Disable monster-statblock-editor" })
  ).toBeInTheDocument();
});

it("explains an empty search and a missing selected user", async () => {
  render(
    await FeatureFlagsPage({
      searchParams: Promise.resolve({ q: "missing", username: "missing" }),
    })
  );
  expect(screen.getByText("No users found.")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("User not found.");
});
