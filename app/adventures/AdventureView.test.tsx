import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Adventure } from "@/lib/db/adventures";
import { AdventureView } from "./AdventureView";
import { getExampleAdventures } from "./exampleAdventures";

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

afterEach(cleanup);

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
    const sample = getExampleAdventures([
      { id: "spiders", name: "Spider Lair" },
      { id: "wax", name: "Wax-Chamber Maze" },
    ])["hidden honey cavern"];
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
    expect(sample.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "encounter",
          parentId: "spider-lair",
          encounterId: "spiders",
        }),
        expect.objectContaining({
          kind: "encounter",
          parentId: "wax-maze",
          encounterId: "wax",
        }),
      ])
    );
  });
});
