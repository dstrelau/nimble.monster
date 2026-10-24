import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { signIn, useSession } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserNavItem } from "./UserNavItem";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("@/components/layout/ModeToggle", () => ({
  ModeToggle: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UserNavItem", () => {
  it("does not invite users to log in while their session is still loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    });

    const { rerender } = render(
      <UserNavItem open={false} onOpenChange={vi.fn()} />
    );
    expect(
      screen.queryByRole("button", { name: /Login to Create/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Loading account" })
    ).toBeDisabled();

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "user-1",
          discordId: "discord-1",
          username: "creator",
          displayName: "Creator",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    rerender(<UserNavItem open={false} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Creator/ })).toBeEnabled();
    expect(screen.queryByText("Login to Create")).not.toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("invites signed-out users to log in before creating", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<UserNavItem open={false} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Login to Create/ }));

    expect(signIn).toHaveBeenCalledWith("discord", {
      redirectTo: "/my/library",
    });
  });

  it("shows Create inside the signed-in user menu", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "user-1",
          discordId: "discord-1",
          username: "creator",
          displayName: "Creator",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<UserNavItem open={true} onOpenChange={vi.fn()} />);

    const accountLinks = screen.getAllByRole("link");
    expect(accountLinks.map((link) => link.textContent)).toEqual([
      "My Library",
      "View Profile",
    ]);
  });
});
