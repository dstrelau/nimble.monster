import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { dismissBanner } from "@/app/actions/user";
import { FreeBanner } from "./FreeBanner";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("@/app/actions/user", () => ({ dismissBanner: vi.fn() }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

it("includes the visible banner in server HTML instead of inserting it after hydration", () => {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: "unauthenticated",
    update: vi.fn(),
  });
  expect(renderToString(<FreeBanner />)).toContain(
    'aria-label="Dismiss banner"'
  );
});

it("keeps a user's dismissed banner out of server HTML", () => {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: {
        id: "user",
        discordId: "discord-user",
        username: "user",
        displayName: "User",
        bannerDismissed: true,
      },
      expires: "2099-01-01",
    },
    status: "authenticated",
    update: vi.fn(),
  });
  expect(renderToString(<FreeBanner />)).not.toContain(
    'aria-label="Dismiss banner"'
  );
});

it("remembers a signed-out dismissal without requiring a server write", () => {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: "unauthenticated",
    update: vi.fn(),
  });
  const { unmount } = render(<FreeBanner />);
  fireEvent.click(screen.getByRole("button", { name: "Dismiss banner" }));
  expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull();
  expect(localStorage.getItem("nimble-nexus-banner-dismissed")).toBe("true");
  expect(dismissBanner).not.toHaveBeenCalled();

  unmount();
  render(<FreeBanner />);
  expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull();
});
