import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpellSchool } from "@/lib/types";

const { mockAuth, mockListAllSpellSchoolsForDiscordID } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockListAllSpellSchoolsForDiscordID: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/school", () => ({
  listAllSpellSchoolsForDiscordID: mockListAllSpellSchoolsForDiscordID,
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/school/SchoolsListView", () => ({
  SchoolsListView: ({ spellSchools }: { spellSchools: SpellSchool[] }) => (
    <div data-testid="schools-list-view">
      {spellSchools.map((s) => (
        <span key={s.id}>{s.name}</span>
      ))}
    </div>
  ),
}));

import MySpellsPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MySpellsPage", () => {
  it("renders the shared filterable list view with the user's spell schools", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });
    mockListAllSpellSchoolsForDiscordID.mockResolvedValue([
      { id: "sc1", name: "Umbral", visibility: "public" },
      { id: "sc2", name: "Draft School", visibility: "private" },
    ]);

    render(await MySpellsPage());

    expect(mockListAllSpellSchoolsForDiscordID).toHaveBeenCalledWith("d1");
    expect(screen.getByTestId("schools-list-view")).toBeInTheDocument();
    expect(screen.getByText("Umbral")).toBeInTheDocument();
    expect(screen.getByText("Draft School")).toBeInTheDocument();
  });

  it("shows the empty state instead of the list view when there are no schools", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });
    mockListAllSpellSchoolsForDiscordID.mockResolvedValue([]);

    render(await MySpellsPage());

    expect(screen.queryByTestId("schools-list-view")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create Your First School" })
    ).toBeInTheDocument();
  });
});
