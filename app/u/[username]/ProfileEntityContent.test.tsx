import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CustomRule } from "@/lib/db/custom-rule";

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
  CollectionCard: () => null,
}));
vi.mock("@/components/companion/CardGrid", () => ({ CardGrid: () => null }));
vi.mock("@/components/encounter/EncountersListView", () => ({
  EncountersListView: () => null,
}));
vi.mock("@/components/family/FamilyCard", () => ({ FamilyCard: () => null }));
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
