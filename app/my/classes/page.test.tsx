import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Class } from "@/lib/types";

const { mockAuth, mockListAllClassesForDiscordID } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockListAllClassesForDiscordID: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  listAllClassesForDiscordID: mockListAllClassesForDiscordID,
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/class/ClassesListView", () => ({
  ClassesListView: ({ classes }: { classes: Class[] }) => (
    <div data-testid="classes-list-view">
      {classes.map((c) => (
        <span key={c.id}>{c.name}</span>
      ))}
    </div>
  ),
}));

import MyClassesPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MyClassesPage", () => {
  it("renders the shared filterable list view with the user's classes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });
    mockListAllClassesForDiscordID.mockResolvedValue([
      { id: "c1", name: "Berserker", visibility: "public" },
      { id: "c2", name: "Draft Class", visibility: "private" },
    ]);

    render(await MyClassesPage());

    expect(mockListAllClassesForDiscordID).toHaveBeenCalledWith("d1");
    expect(screen.getByTestId("classes-list-view")).toBeInTheDocument();
    expect(screen.getByText("Berserker")).toBeInTheDocument();
    expect(screen.getByText("Draft Class")).toBeInTheDocument();
  });

  it("shows the empty state instead of the list view when there are no classes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });
    mockListAllClassesForDiscordID.mockResolvedValue([]);

    render(await MyClassesPage());

    expect(screen.queryByTestId("classes-list-view")).not.toBeInTheDocument();
    expect(
      screen.getByText("You haven't created any classes yet.")
    ).toBeInTheDocument();
  });
});
