import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));

import CreatePage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreatePage reference tables", () => {
  it("shows the card but requires sign-in to create a table", async () => {
    mockAuth.mockResolvedValue(null);

    render(await CreatePage());

    expect(screen.getByText("Reference Table")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Reference Table / })
    ).not.toBeInTheDocument();
  });

  it("allows any authenticated user to create a table without a feature flag", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    render(await CreatePage());

    const link = screen.getByRole("link", { name: /^Reference Table / });
    expect(link).toHaveAttribute("href", "/tables/new");
    expect(link.querySelector("svg")).toHaveClass("lucide-table-2");
  });
});
