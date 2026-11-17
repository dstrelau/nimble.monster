import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HazardMini, MonsterMini } from "@/lib/services/monsters";
import type { CollectionOverview, SpellSchoolMini } from "@/lib/types";

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => null,
}));
vi.mock("@/components/icons/GameIcon", () => ({ GameIcon: () => null }));

import { CollectionPlateCard } from "./CollectionPlateCard";

afterEach(cleanup);

const createdAt = new Date("2026-10-20T00:00:00Z");

const monster = (id: string, name: string, levelInt: number): MonsterMini => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  name,
  level: String(levelInt),
  levelInt,
  visibility: "public",
  createdAt,
  hazard: false,
  hp: 10,
  legendary: false,
  minion: false,
  size: "medium",
  armor: "none",
});

const hazard: HazardMini = {
  id: "00000000-0000-4000-8000-000000000009",
  name: "Glyph of Warning",
  level: "2",
  levelInt: 2,
  visibility: "public",
  createdAt,
  hazard: true,
};

const school: SpellSchoolMini = {
  id: "00000000-0000-4000-8000-00000000000a",
  name: "Acid",
  visibility: "public",
  spellCount: 10,
  createdAt,
};

const collection = (
  name: string,
  overrides: Partial<CollectionOverview> = {}
): CollectionOverview => ({
  id: "0000aaaa-2bc3-44bb-a9e7-000000000095",
  name,
  creator: {
    id: "u1",
    discordId: "d1",
    username: "sanity",
    displayName: "Sanity",
  },
  visibility: "public",
  legendaryCount: 0,
  standardCount: 0,
  monsters: [],
  items: [],
  itemCount: 0,
  companions: [],
  ancestries: [],
  backgrounds: [],
  subclasses: [],
  spellSchools: [],
  classes: [],
  customRules: [],
  ...overrides,
});

describe("CollectionPlateCard", () => {
  it("splits a weekly name and counts hazards apart from monsters", () => {
    render(
      <CollectionPlateCard
        collection={collection("Monstery Monday Week 95 - Contrast", {
          monsters: [
            monster("1", "Duo", 1),
            monster("2", "Black Knight", 6),
            hazard,
          ],
          spellSchools: [school],
        })}
      />
    );

    expect(screen.getByText("Week 95")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Contrast" })).toBeTruthy();
    const counts = screen.getByRole("list", { name: "Contents" });
    expect(
      within(counts)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual(["2 monsters", "1 hazard", "1 spell school"]);
    expect(screen.getByText("10 spells")).toBeTruthy();
  });

  it("keeps a name without a week number as the title", () => {
    render(
      <CollectionPlateCard
        collection={collection("Spooky Extras: Week of Dread")}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Spooky Extras: Week of Dread" })
    ).toBeTruthy();
    expect(screen.queryByText(/^Week /)).toBeNull();
  });
});
