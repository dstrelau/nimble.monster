import { afterEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));

import UserProfileRedirectPage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("UserProfileRedirectPage", () => {
  it("redirects a profile to its monsters route by default", async () => {
    await UserProfileRedirectPage({
      params: Promise.resolve({ username: "nimble-co" }),
      searchParams: Promise.resolve({}),
    });

    expect(redirect).toHaveBeenCalledWith("/u/nimble-co/monsters");
  });

  it("converts a legacy tab parameter and preserves filters", async () => {
    await UserProfileRedirectPage({
      params: Promise.resolve({ username: "nimble-co" }),
      searchParams: Promise.resolve({
        tab: "ancestries",
        search: "human",
        source: ["Core", "Legacy"],
      }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/u/nimble-co/ancestries?search=human&source=Core&source=Legacy"
    );
  });

  it("falls back to monsters for an unknown legacy tab", async () => {
    await UserProfileRedirectPage({
      params: Promise.resolve({ username: "nimble-co" }),
      searchParams: Promise.resolve({ tab: "secrets" }),
    });

    expect(redirect).toHaveBeenCalledWith("/u/nimble-co/monsters");
  });
});
