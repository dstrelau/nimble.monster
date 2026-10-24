import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useSession } from "next-auth/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { FreeBanner } from "./FreeBanner";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
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
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: "unauthenticated",
    update: vi.fn(),
  });
  const { unmount } = render(<FreeBanner />);
  fireEvent.click(screen.getByRole("button", { name: "Dismiss banner" }));
  expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull();
  expect(localStorage.getItem("nimble-nexus-banner-dismissed")).toBe("true");
  expect(fetch).not.toHaveBeenCalled();

  unmount();
  render(<FreeBanner />);
  expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull();
});

it.each(["success", "http failure", "network failure"])(
  "hides immediately and retains local dismissal through %s using stable JSON transport",
  async (outcome) => {
    let release: (response: Response) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const pending = new Promise<Response>((resolve, fail) => {
      release = resolve;
      reject = fail;
    });
    const fetch = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetch);
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "owner",
          discordId: "discord-owner",
          username: "owner",
          displayName: "Owner",
          bannerDismissed: false,
        },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    const { unmount } = render(<FreeBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss banner" }));
    expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull();
    expect(localStorage.getItem("nimble-nexus-banner-dismissed")).toBe("true");
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/_actions/dismissBanner", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const headers = new Headers(fetch.mock.calls[0][1].headers);
    expect(headers.has("next-action")).toBe(false);
    if (outcome === "network failure") {
      reject(new TypeError("Failed to fetch"));
    } else {
      release(
        Response.json(
          outcome === "success" ? { success: true } : { error: "Unavailable" },
          { status: outcome === "success" ? 200 : 500 }
        )
      );
    }
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unmount();
    render(<FreeBanner />);
    expect(screen.queryByRole("button", { name: "Dismiss banner" })).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  }
);
