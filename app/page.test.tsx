import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import HomePage from "./page";

const { account } = vi.hoisted(
  (): {
    account: { userId: string | undefined; enabled: boolean };
  } => ({ account: { userId: "dev-user", enabled: false } })
);

vi.mock("@/lib/auth", () => ({
  auth: async () => (account.userId ? { user: { id: account.userId } } : null),
}));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: async (id: string | undefined) =>
    !!id && account.enabled,
}));
vi.mock("@/components/home/FieldGuideHome", () => ({
  FieldGuideHome: () => <h1>Your next session starts here.</h1>,
}));
vi.mock("@/lib/services/families/repository", () => ({
  getRandomFeaturedFamily: async () => null,
}));
vi.mock("@/lib/services/items", () => ({
  itemsService: { getRandomRecentItems: async () => [] },
}));

afterEach(cleanup);

it("keeps the current homepage unless the account has opted in", async () => {
  account.enabled = false;
  render(await HomePage());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Your homebrew hub"
  );
  expect(
    screen.queryByText("Your next session starts here.")
  ).not.toBeInTheDocument();
  cleanup();
  account.enabled = true;
  render(await HomePage());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Your next session starts here."
  );
  cleanup();
  account.userId = undefined;
  render(await HomePage());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Your homebrew hub"
  );
});
