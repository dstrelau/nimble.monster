import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Subclass } from "@/lib/types";

const { mockAuth, mockListAllSubclassesForDiscordID } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockListAllSubclassesForDiscordID: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  listAllSubclassesForDiscordID: mockListAllSubclassesForDiscordID,
}));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/components/subclass/SubclassesListView", () => ({
  SubclassesListView: ({ subclasses }: { subclasses: Subclass[] }) => (
    <div data-testid="subclasses-list-view">
      {subclasses.map((s) => (
        <span key={s.id}>{s.name}</span>
      ))}
    </div>
  ),
}));

import MySubclassesPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MySubclassesPage", () => {
  it("renders the shared filterable list view with the user's subclasses", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });
    mockListAllSubclassesForDiscordID.mockResolvedValue([
      { id: "s1", name: "Path of Fury", visibility: "public" },
      { id: "s2", name: "Draft Path", visibility: "private" },
    ]);

    render(await MySubclassesPage());

    expect(mockListAllSubclassesForDiscordID).toHaveBeenCalledWith("d1");
    expect(screen.getByTestId("subclasses-list-view")).toBeInTheDocument();
    expect(screen.getByText("Path of Fury")).toBeInTheDocument();
    expect(screen.getByText("Draft Path")).toBeInTheDocument();
  });

  it("shows the empty state instead of the list view when there are no subclasses", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });
    mockListAllSubclassesForDiscordID.mockResolvedValue([]);

    render(await MySubclassesPage());

    expect(
      screen.queryByTestId("subclasses-list-view")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first subclass" })
    ).toBeInTheDocument();
  });
});
