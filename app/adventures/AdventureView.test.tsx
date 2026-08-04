import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Adventure } from "@/lib/db/adventures";
import { AdventureView } from "./AdventureView";
import { getExampleAdventures } from "./exampleAdventures";

const { mockUseConditions } = vi.hoisted(() => ({
  mockUseConditions: vi.fn(),
}));

vi.mock("@/components/item/Card", () => ({
  Card: ({ item }: { item: { name: string } }) => (
    <div>Item statblock: {item.name}</div>
  ),
}));
vi.mock("@/components/monster/Card", () => ({
  Card: ({ monster }: { monster: { name: string } }) => (
    <div>Monster statblock: {monster.name}</div>
  ),
}));
vi.mock("@/components/encounter/EncounterCard", () => ({
  EncounterCard: ({ encounter }: { encounter: { name: string } }) => (
    <div>Encounter card: {encounter.name}</div>
  ),
}));
vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: mockUseConditions,
}));

const officialBlinded = {
  id: "official-blinded",
  name: "Blinded",
  description: "You cannot see.",
  official: true,
};

beforeEach(() => {
  mockUseConditions.mockReturnValue({
    allConditions: [officialBlinded],
    isLoading: false,
  });
});

afterEach(() => {
  cleanup();
  mockUseConditions.mockReset();
});

describe("AdventureView", () => {
  it("renders ordered nested content, callouts, and encounter cards", () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "A Perilous Test",
      tagline: "Mind the fixtures",
      summary: "A short test adventure.",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "root",
          parentId: null,
          kind: "section",
          orderIndex: 0,
          title: "First Stop",
          content: "Welcome, **heroes**.",
          encounter: null,
          statblock: null,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "warning",
          parentId: "root",
          kind: "callout",
          orderIndex: 0,
          title: "Watch Out",
          content: "The floor is trapped.",
          encounter: null,
          statblock: null,
          referenceRemoved: false,
          presentation: "warning",
        },
        {
          id: "fight",
          parentId: "root",
          kind: "encounter",
          orderIndex: 1,
          title: "",
          content: "The monsters defend their den.",
          encounter: {
            id: "00000000-0000-0000-0000-000000000001",
            name: "Den Defenders",
            description: "Defenders of the den.",
            visibility: "public",
            heroCount: 4,
            heroLevel: 1,
            creator: {
              id: "creator",
              discordId: "creator-discord",
              username: "test-author",
              displayName: "Test Author",
            },
            monsters: [],
          },
          statblock: null,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "treasure",
          parentId: "root",
          kind: "statblock",
          orderIndex: 2,
          title: "Reward",
          content: "The heroes find this item.",
          encounter: null,
          statblock: {
            entityType: "item",
            entity: {
              id: "00000000-0000-0000-0000-000000000002",
              name: "Honey Wand",
              description: "A very sticky wand.",
              rarity: "uncommon",
              visibility: "public",
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: {
                id: "creator",
                discordId: "creator-discord",
                username: "test-author",
                displayName: "Test Author",
              },
            },
          },
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "removed",
          parentId: "root",
          kind: "encounter",
          orderIndex: 3,
          title: "Lost encounter",
          content: "",
          encounter: null,
          statblock: null,
          referenceRemoved: true,
          presentation: null,
        },
      ],
    };

    render(<AdventureView adventure={adventure} />);

    expect(
      screen.getByRole("heading", { name: "A Perilous Test" })
    ).toBeVisible();
    expect(screen.getByText("Test Author")).toBeVisible();
    expect(screen.getByText("heroes").tagName.toLowerCase()).toBe("strong");
    expect(screen.getByText("Watch Out")).toBeVisible();
    const encounterCard = screen.getByText("Encounter card: Den Defenders");
    expect(encounterCard).toBeVisible();
    expect(encounterCard.closest(".grid")).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "xl:grid-cols-3"
    );
    expect(
      screen.queryByText("The monsters defend their den.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Item statblock: Honey Wand")).toBeVisible();
    expect(screen.queryByText("Reward")).not.toBeInTheDocument();
    expect(
      screen.queryByText("The heroes find this item.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Removed content")).toBeVisible();
  });

  it("provides a valid loadable sample tree", () => {
    const sample = getExampleAdventures({
      giantSpiderId: "giant-spider",
      waxGolemId: "wax-golem",
    })["hidden honey cavern"];
    const ids = new Set(sample.nodes.map((node) => node.id));
    const nodesById = new Map(sample.nodes.map((node) => [node.id, node]));

    expect(sample.name).toBe("The Hidden Honey Cavern");
    expect(sample.nodes.length).toBeGreaterThan(10);
    expect(
      sample.nodes.every((node) => !node.parentId || ids.has(node.parentId))
    ).toBe(true);
    expect(sample.nodes.some((node) => node.kind === "callout")).toBe(true);
    expect(
      sample.nodes.every((node) => {
        if (!node.parentId) return true;
        return nodesById.get(node.parentId)?.kind === "section";
      })
    ).toBe(true);
    expect(
      sample.nodes.every((node) => {
        let depth = 0;
        let parentId = node.parentId;
        while (parentId) {
          depth += 1;
          parentId = nodesById.get(parentId)?.parentId ?? null;
        }
        return depth <= 2;
      })
    ).toBe(true);
    expect(
      sample.nodes.filter((node) => node.kind === "encounter")
    ).toHaveLength(0);
    const statblockNodes = sample.nodes.filter(
      (node) => node.kind === "statblock"
    );
    expect(statblockNodes).toHaveLength(2);
    expect(
      statblockNodes.map(({ parentId, monsterId }) => ({
        parentId,
        monsterId,
      }))
    ).toEqual([
      { parentId: "spider-lair", monsterId: "giant-spider" },
      { parentId: "wax-maze", monsterId: "wax-golem" },
    ]);
  });

  it("omits an example statblock when its official monster is unavailable", () => {
    const sample = getExampleAdventures({ giantSpiderId: "giant-spider" })[
      "hidden honey cavern"
    ];

    expect(sample.nodes.filter((node) => node.kind === "statblock")).toEqual([
      expect.objectContaining({
        parentId: "spider-lair",
        monsterId: "giant-spider",
      }),
    ]);
    expect(
      sample.nodes.some(
        (node) => node.parentId === "wax-maze" && node.kind === "statblock"
      )
    ).toBe(false);
  });

  it("passes official conditions to formatted adventure content", () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "Condition Test",
      tagline: "",
      summary: "",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "condition-node",
          parentId: null,
          kind: "text",
          orderIndex: 0,
          title: "",
          content: "The hero is [[Blinded]].",
          encounter: null,
          statblock: null,
          referenceRemoved: false,
          presentation: null,
        },
      ],
    };

    render(<AdventureView adventure={adventure} />);

    expect(screen.getByText("Blinded")).toHaveClass("cursor-default");
  });

  it("keeps content visible while conditions load and resolves it after ready", async () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "Loading Conditions",
      tagline: "",
      summary: "",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "loading-node",
          parentId: null,
          kind: "section",
          orderIndex: 0,
          title: "Loading Section",
          content: "The hero is [[Blinded]].",
          encounter: null,
          statblock: null,
          referenceRemoved: false,
          presentation: null,
        },
      ],
    };
    mockUseConditions
      .mockReturnValueOnce({ allConditions: [], isLoading: true })
      .mockReturnValueOnce({
        allConditions: [officialBlinded],
        isLoading: false,
      });

    const { rerender } = render(<AdventureView adventure={adventure} />);

    expect(
      screen.getByRole("heading", { name: "Loading Section" })
    ).toBeVisible();
    expect(screen.getByText("Blinded")).toHaveClass("cursor-help");

    rerender(<AdventureView adventure={adventure} />);

    await waitFor(() => {
      expect(screen.getByText("Blinded")).toHaveClass("cursor-default");
    });
  });
});
