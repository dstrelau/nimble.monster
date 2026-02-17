import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const {
  mockGetCollection,
  mockListConditionsForDiscordId,
  mockListOfficialConditions,
} = vi.hoisted(() => ({
  mockGetCollection: vi.fn(),
  mockListConditionsForDiscordId: vi.fn(),
  mockListOfficialConditions: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  getCollection: mockGetCollection,
  listConditionsForDiscordId: mockListConditionsForDiscordId,
  listOfficialConditions: mockListOfficialConditions,
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn((slug: string) => {
    if (slug === "invalid-slug") return null;
    return "550e8400-e29b-41d4-a716-446655440000";
  }),
  slugify: vi.fn(
    (c: { name: string }) => `${c.name.toLowerCase().replace(/ /g, "-")}-abc`
  ),
}));

vi.mock("@/lib/utils/url", () => ({
  getCollectionUrl: vi.fn((c: { name: string }) => `/collections/${c.name}`),
}));

const notFoundSentinel = Symbol("notFound");
const redirectSentinel = Symbol("redirect");
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundSentinel;
  }),
  permanentRedirect: vi.fn(() => {
    throw redirectSentinel;
  }),
}));

// Mock all card components to simple stubs
vi.mock("@/app/ui/monster/Card", () => ({
  Card: ({ monster }: { monster: { name: string } }) => (
    <div data-testid="monster-card">{monster.name}</div>
  ),
}));
vi.mock("@/app/ui/item/Card", () => ({
  Card: ({ item }: { item: { name: string } }) => (
    <div data-testid="item-card">{item.name}</div>
  ),
}));
vi.mock("@/app/ui/companion/Card", () => ({
  Card: ({ companion }: { companion: { name: string } }) => (
    <div data-testid="companion-card">{companion.name}</div>
  ),
}));
vi.mock("@/app/ui/ancestry/Card", () => ({
  Card: ({ ancestry }: { ancestry: { name: string } }) => (
    <div data-testid="ancestry-card">{ancestry.name}</div>
  ),
}));
vi.mock("@/app/ui/background/Card", () => ({
  Card: ({ background }: { background: { name: string } }) => (
    <div data-testid="background-card">{background.name}</div>
  ),
}));
vi.mock("@/app/ui/subclass/SubclassMiniCard", () => ({
  SubclassMiniCard: ({ subclass }: { subclass: { name: string } }) => (
    <div data-testid="subclass-card">{subclass.name}</div>
  ),
}));
vi.mock("@/app/ui/school/Card", () => ({
  Card: ({ spellSchool }: { spellSchool: { name: string } }) => (
    <div data-testid="school-card">{spellSchool.name}</div>
  ),
}));
vi.mock("@/components/CollectionHeader", () => ({
  CollectionHeader: () => <div data-testid="collection-header" />,
}));

import { render, screen } from "@testing-library/react";
import ShowCollectionView from "./page";

const CREATOR = {
  id: "user-uuid",
  discordId: "discord-creator",
  username: "creator",
  displayName: "Creator",
};

function makeCollection(overrides = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "test collection",
    visibility: "public",
    creator: CREATOR,
    monsters: [],
    items: [],
    companions: [],
    ancestries: [],
    backgrounds: [],
    subclasses: [],
    spellSchools: [],
    ...overrides,
  };
}

const params = Promise.resolve({ id: "test-collection-abc" });

describe("ShowCollectionView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockListOfficialConditions.mockResolvedValue([]);
    mockListConditionsForDiscordId.mockResolvedValue([]);
  });

  it("calls notFound for invalid slug", async () => {
    const badParams = Promise.resolve({ id: "invalid-slug" });
    await expect(ShowCollectionView({ params: badParams })).rejects.toBe(
      notFoundSentinel
    );
  });

  it("calls notFound when collection does not exist", async () => {
    mockGetCollection.mockResolvedValue(null);
    await expect(ShowCollectionView({ params })).rejects.toBe(notFoundSentinel);
  });

  it("shows empty message when collection has no entities", async () => {
    mockGetCollection.mockResolvedValue(makeCollection());
    const jsx = await ShowCollectionView({ params });
    const { container } = render(jsx);
    expect(container.textContent).toContain("This collection is empty");
  });

  it("renders monster and item cards", async () => {
    const fakeMonster = {
      id: "m1",
      name: "Goblin",
      levelInt: 1,
      creator: CREATOR,
    };
    const fakeItem = {
      id: "i1",
      name: "Sword",
      creator: CREATOR,
    };
    mockGetCollection.mockResolvedValue(
      makeCollection({ monsters: [fakeMonster], items: [fakeItem] })
    );

    const jsx = await ShowCollectionView({ params });
    render(jsx);

    expect(screen.getByTestId("monster-card")).toHaveTextContent("Goblin");
    expect(screen.getByTestId("item-card")).toHaveTextContent("Sword");
  });

  it("renders new entity type cards", async () => {
    mockGetCollection.mockResolvedValue(
      makeCollection({
        companions: [{ id: "c1", name: "Wolf", creator: CREATOR }],
        ancestries: [{ id: "a1", name: "Elf" }],
        backgrounds: [{ id: "b1", name: "Sage" }],
        subclasses: [{ id: "sc1", name: "Berserker" }],
        spellSchools: [{ id: "ss1", name: "Evocation" }],
      })
    );

    const jsx = await ShowCollectionView({ params });
    render(jsx);

    expect(screen.getByTestId("companion-card")).toHaveTextContent("Wolf");
    expect(screen.getByTestId("ancestry-card")).toHaveTextContent("Elf");
    expect(screen.getByTestId("background-card")).toHaveTextContent("Sage");
    expect(screen.getByTestId("subclass-card")).toHaveTextContent("Berserker");
    expect(screen.getByTestId("school-card")).toHaveTextContent("Evocation");
  });

  it("calls notFound for private collection when not the creator", async () => {
    mockGetCollection.mockResolvedValue(
      makeCollection({ visibility: "private" })
    );
    mockAuth.mockResolvedValue({
      user: { id: "other", discordId: "discord-other" },
    });

    await expect(ShowCollectionView({ params })).rejects.toBe(notFoundSentinel);
  });

  it("renders private collection for the creator", async () => {
    mockGetCollection.mockResolvedValue(
      makeCollection({ visibility: "private" })
    );
    mockAuth.mockResolvedValue({
      user: { id: "user-uuid", discordId: "discord-creator" },
    });

    const jsx = await ShowCollectionView({ params });
    const { container } = render(jsx);
    expect(container.textContent).toContain("This collection is empty");
  });
});
