import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockGetCollection } = vi.hoisted(() => ({
  mockGetCollection: vi.fn(),
}));
const { mockListAllMonstersForDiscordID } = vi.hoisted(() => ({
  mockListAllMonstersForDiscordID: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ getCollection: mockGetCollection }));
vi.mock("@/lib/services/monsters/repository", () => ({
  listAllMonstersForDiscordID: mockListAllMonstersForDiscordID,
}));
vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn(() => "550e8400-e29b-41d4-a716-446655440000"),
  slugify: vi.fn(
    (c: { name: string }) => `${c.name.toLowerCase().replace(/ /g, "-")}-abc`
  ),
}));

const notFoundSentinel = Symbol("notFound");
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundSentinel;
  }),
  permanentRedirect: vi.fn(),
}));

vi.mock("../../CreateEditCollection", () => ({
  CreateEditCollection: () => null,
}));

import EditCollectionPage from "./page";

const COLLECTION_ID = "550e8400-e29b-41d4-a716-446655440000";
const CREATOR_DISCORD_ID = "discord-creator";
const OTHER_DISCORD_ID = "discord-other";

const privateCollection = {
  id: COLLECTION_ID,
  name: "My Collection",
  visibility: "private",
  creator: { discordId: CREATOR_DISCORD_ID },
  monsters: [],
  items: [],
  spellSchools: [],
};

const params = Promise.resolve({ id: "my-collection-abc" });

describe("EditCollectionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListAllMonstersForDiscordID.mockResolvedValue([]);
  });

  it("renders the edit page when logged in as the collection creator", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: CREATOR_DISCORD_ID },
    });
    mockGetCollection.mockImplementation((_id: string, discordId?: string) =>
      discordId === CREATOR_DISCORD_ID ? privateCollection : null
    );

    const result = await EditCollectionPage({ params });
    expect(result).toBeDefined();
  });

  it("returns not found when logged in as a different user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-2", discordId: OTHER_DISCORD_ID },
    });
    mockGetCollection.mockImplementation((_id: string, discordId?: string) =>
      discordId === CREATOR_DISCORD_ID ? privateCollection : null
    );

    await expect(EditCollectionPage({ params })).rejects.toBe(notFoundSentinel);
  });

  it("returns not found when not logged in", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(EditCollectionPage({ params })).rejects.toBe(notFoundSentinel);
    expect(mockGetCollection).not.toHaveBeenCalled();
  });
});
