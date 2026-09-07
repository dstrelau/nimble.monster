import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CustomRule } from "@/lib/db/custom-rule";
import type { CollectionOverview, Family, User } from "@/lib/types";

vi.mock("@/components/adventure/AdventureList", () => ({
  AdventureList: () => null,
}));
vi.mock("@/components/ancestry/PaginatedAncestryGrid", () => ({
  PaginatedAncestryGrid: () => null,
}));
vi.mock("@/components/background/PaginatedBackgroundGrid", () => ({
  PaginatedBackgroundGrid: () => null,
}));
vi.mock("@/components/class/ClassesListView", () => ({
  ClassesListView: () => null,
}));
vi.mock("@/components/collection/CollectionCard", () => ({
  CollectionCard: ({ collection }: { collection: CollectionOverview }) => (
    <div>{collection.name}</div>
  ),
}));
vi.mock("@/components/companion/CardGrid", () => ({ CardGrid: () => null }));
vi.mock("@/components/encounter/EncountersListView", () => ({
  EncountersListView: () => null,
}));
vi.mock("@/components/family/FamilyCard", () => ({
  FamilyCard: ({ family }: { family: Family }) => <div>{family.name}</div>,
}));
vi.mock("@/components/item/CardGrid", () => ({ CardGrid: () => null }));
vi.mock("@/components/monster/PaginatedMonsterGrid", () => ({
  PaginatedMonsterGrid: () => null,
}));
vi.mock("@/components/school/SchoolsListView", () => ({
  SchoolsListView: () => null,
}));
vi.mock("@/components/subclass/SubclassesListView", () => ({
  SubclassesListView: () => null,
}));

import ProfileEntityContent from "./ProfileEntityContent";

afterEach(cleanup);

const creator: User = {
  id: "user-1",
  discordId: "discord-1",
  username: "creator",
  displayName: "Creator",
};

describe("ProfileEntityContent public containers", () => {
  it("renders an empty family", () => {
    const family: Family = {
      id: "family-1",
      name: "Empty Family",
      abilities: [],
      creatorId: creator.id,
      creator,
      visibility: "public",
      monsterCount: 0,
      monsters: [],
    };

    render(<ProfileEntityContent entityType="families" families={[family]} />);

    expect(screen.getByText("Empty Family")).toBeInTheDocument();
  });

  it("renders an empty collection", () => {
    const collection: CollectionOverview = {
      id: "collection-1",
      name: "Empty Collection",
      creator,
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
    };

    render(
      <ProfileEntityContent
        entityType="collections"
        collections={[collection]}
      />
    );

    expect(screen.getByText("Empty Collection")).toBeInTheDocument();
  });
});

describe("ProfileEntityContent custom rules", () => {
  it("shows the official rules each custom rule replaces or augments", () => {
    const rule: CustomRule = {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Hardcore Recovery",
      content: "",
      keywords: "",
      visibility: "public",
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      links: [
        { ruleSlug: "death", relation: "replaces" },
        { ruleSlug: "wounds", relation: "augments" },
      ],
      creator: {
        id: "user-1",
        discordId: "discord-1",
        username: "creator",
        displayName: "Creator",
      },
    };

    render(<ProfileEntityContent entityType="rules" rules={[rule]} />);

    expect(screen.getByText("Replaces: Death")).toBeInTheDocument();
    expect(screen.getByText("Augments: Wounds")).toBeInTheDocument();
    expect(
      screen.queryByText("2 linked official rules")
    ).not.toBeInTheDocument();
  });
});
