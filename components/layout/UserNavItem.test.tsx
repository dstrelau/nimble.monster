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
  it("invites signed-out users to log in before creating", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<UserNavItem open={false} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Login to Create/ }));

    expect(signIn).toHaveBeenCalledWith("discord", {
      redirectTo: "/create",
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

    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute(
      "href",
      "/create"
    );
    const accountLinks = screen.getAllByRole("link");
    expect(accountLinks.map((link) => link.textContent)).toEqual([
      "Create",
      "My Library",
      "View Profile",
    ]);
  });
});
