import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Encounter, EncounterMonsterEntryFull } from "@/lib/types";
import { slugify } from "@/lib/utils/slug";

const { mockAuth, mockGetEncounter } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetEncounter: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ getEncounter: mockGetEncounter }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("./NewEncounterClient", () => ({
  NewEncounter: ({ initialEncounter }: { initialEncounter?: Encounter }) => (
    <output aria-label="Encounter draft">
      {JSON.stringify(initialEncounter ?? null)}
    </output>
  ),
}));

import NewEncounterPage from "./page";

const viewer = {
  id: "viewer",
  discordId: "viewer-discord",
  username: "viewer",
  displayName: "Viewer",
};
const creator = { ...viewer, id: "creator", discordId: "creator-discord" };

const publicEntry: EncounterMonsterEntryFull = {
  quantity: 3,
  isPerHero: true,
  heroesPerMonster: 2,
  monster: {
    id: "public-hazard",
    name: "Public hazard",
    hazard: true,
    visibility: "public",
    level: "2",
    levelInt: 2,
    creator,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    abilities: [],
    actions: [],
    actionPreface: "",
  },
};
const ownedEntry: EncounterMonsterEntryFull = {
  ...publicEntry,
  monster: {
    ...publicEntry.monster,
    id: "owned-private",
    name: "Viewer's private hazard",
    visibility: "private",
    creator: viewer,
  },
};
const foreignPrivateEntry: EncounterMonsterEntryFull = {
  ...ownedEntry,
  monster: {
    ...ownedEntry.monster,
    id: "foreign-private",
    name: "Someone else's private hazard",
    creator,
  },
};
const source: Encounter = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  creator,
  name: "River Crossing",
  description: "Hold the bridge.",
  visibility: "public",
  heroCount: 6,
  heroLevel: 7,
  monsters: [publicEntry, ownedEntry, foreignPrivateEntry],
};

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: viewer });
  mockGetEncounter.mockImplementation(async (id: string, discordId?: string) =>
    id === source.id && discordId === viewer.discordId ? source : null
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NewEncounterPage", () => {
  it("requires authentication and still allows a blank new encounter", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(
      NewEncounterPage({
        searchParams: Promise.resolve({ remix: slugify(source) }),
      })
    ).rejects.toThrow("REDIRECT:/create");

    render(await NewEncounterPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByLabelText("Encounter draft")).toHaveTextContent("null");
  });

  it("copies editable fields and quantity rules, but not identity or inaccessible private stat blocks", async () => {
    render(
      await NewEncounterPage({
        searchParams: Promise.resolve({ remix: slugify(source) }),
      })
    );
    expect(
      JSON.parse(screen.getByLabelText("Encounter draft").textContent ?? "")
    ).toEqual(
      JSON.parse(
        JSON.stringify({
          id: "",
          creator: viewer,
          name: "River Crossing",
          description: "Hold the bridge.",
          visibility: "public",
          heroCount: 6,
          heroLevel: 7,
          monsters: [publicEntry, ownedEntry],
        })
      )
    );
    expect(source.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(source.monsters).toHaveLength(3);
  });

  it.each([
    "invalid",
    [slugify(source), slugify(source)],
  ])("returns not found for an invalid remix parameter %j", async (remix) => {
    await expect(
      NewEncounterPage({ searchParams: Promise.resolve({ remix }) })
    ).rejects.toThrow("NOT_FOUND");
  });

  it("does not expose missing or unauthorized private encounters", async () => {
    mockGetEncounter.mockResolvedValue(null);
    await expect(
      NewEncounterPage({
        searchParams: Promise.resolve({ remix: slugify(source) }),
      })
    ).rejects.toThrow("NOT_FOUND");
  });
});
