import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Collection } from "@/lib/types";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockFindPublicCollectionById } = vi.hoisted(() => {
  return { mockFindPublicCollectionById: vi.fn() };
});

vi.mock("@/lib/services/collections/repository", () => ({
  findPublicCollectionById: mockFindPublicCollectionById,
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn((slug: string) => {
    if (slug === "invalid-slug") {
      throw new Error("Invalid slug");
    }
    return "550e8400-e29b-41d4-a716-446655440000";
  }),
  uuidToIdentifier: vi.fn((uuid: string) => {
    return "0psvtrh43w8xm9dfbf5b6nkcq1";
  }),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
};

describe("GET /api/collections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return a collection by id", async () => {
    const mockCollection: Collection = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Collection",
      visibility: "public",
      legendaryCount: 1,
      standardCount: 2,
      creator: fakeCreator,
      monsters: [],
      items: [],
      itemCount: 0,
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicCollectionById.mockResolvedValue(mockCollection);

    const request = new Request(
      "http://localhost:3000/api/collections/my-collection-abc"
    );
    const response = await GET(request, createMockParams("my-collection-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );

    expect(data).toHaveProperty("data");
    const resource = data.data;
    expect(resource.type).toBe("collections");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");
    expect(resource.attributes.name).toBe("My Collection");
  });

  it("should return 404 for non-existent collection", async () => {
    mockFindPublicCollectionById.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/collections/nonexistent"
    );
    const response = await GET(request, createMockParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Collection not found");
  });

  it("should return 404 for invalid slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/collections/invalid-slug"
    );
    const response = await GET(request, createMockParams("invalid-slug"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Collection not found");
  });

  it("should include monsters when include=monsters is specified", async () => {
    const mockCollection: Collection = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Collection",
      visibility: "public",
      legendaryCount: 0,
      standardCount: 2,
      creator: fakeCreator,
      monsters: [
        {
          id: "monster-id-1",
          name: "Goblin",
          level: "1",
          levelInt: 1,
          hp: 10,
          legendary: false,
          minion: false,
          armor: "none",
          size: "small",
          speed: 6,
          fly: 0,
          swim: 0,
          climb: 0,
          teleport: 0,
          burrow: 0,
          visibility: "public",
          abilities: [],
          actions: [],
          actionPreface: "",
          creator: fakeCreator,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
        },
      ],
      items: [],
      itemCount: 0,
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicCollectionById.mockResolvedValue(mockCollection);

    const request = new Request(
      "http://localhost:3000/api/collections/my-collection-abc?include=monsters"
    );
    const response = await GET(request, createMockParams("my-collection-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("included");
    expect(Array.isArray(data.included)).toBe(true);
    expect(data.included).toHaveLength(1);

    const monsterResource = data.included[0];
    expect(monsterResource.type).toBe("monsters");
    expect(monsterResource).toHaveProperty("id");
    expect(monsterResource).toHaveProperty("attributes");

    expect(data.data.relationships).toHaveProperty("monsters");
    expect(data.data.relationships.monsters.data).toHaveLength(1);
    expect(data.data.relationships.monsters.data[0].type).toBe("monsters");
  });

  it("should not include monsters when include parameter is absent", async () => {
    const mockCollection: Collection = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Collection",
      visibility: "public",
      legendaryCount: 0,
      standardCount: 2,
      creator: fakeCreator,
      monsters: [
        {
          id: "monster-id-1",
          name: "Goblin",
          level: "1",
          levelInt: 1,
          hp: 10,
          legendary: false,
          minion: false,
          armor: "none",
          size: "small",
          speed: 6,
          fly: 0,
          swim: 0,
          climb: 0,
          teleport: 0,
          burrow: 0,
          visibility: "public",
          abilities: [],
          actions: [],
          actionPreface: "",
          creator: fakeCreator,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
        },
      ],
      items: [],
      itemCount: 0,
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicCollectionById.mockResolvedValue(mockCollection);

    const request = new Request(
      "http://localhost:3000/api/collections/my-collection-abc"
    );
    const response = await GET(request, createMockParams("my-collection-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).not.toHaveProperty("included");
  });

  it("should include items when include=items is specified", async () => {
    const mockCollection: Collection = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Collection",
      visibility: "public",
      legendaryCount: 0,
      standardCount: 0,
      creator: fakeCreator,
      monsters: [],
      items: [
        {
          id: "item-id-1",
          name: "Magic Sword",
          kind: "Weapon",
          rarity: "rare",
          visibility: "public",
          description: "A powerful magic sword",
          moreInfo: undefined,
          creator: fakeCreator,
          updatedAt: new Date("2025-01-01"),
        },
      ],
      itemCount: 1,
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicCollectionById.mockResolvedValue(mockCollection);

    const request = new Request(
      "http://localhost:3000/api/collections/my-collection-abc?include=items"
    );
    const response = await GET(request, createMockParams("my-collection-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("included");
    expect(Array.isArray(data.included)).toBe(true);
    expect(data.included).toHaveLength(1);

    const itemResource = data.included[0];
    expect(itemResource.type).toBe("items");
    expect(itemResource).toHaveProperty("id");
    expect(itemResource).toHaveProperty("attributes");

    expect(data.data.relationships).toHaveProperty("items");
    expect(data.data.relationships.items.data).toHaveLength(1);
    expect(data.data.relationships.items.data[0].type).toBe("items");
  });

  it("should include both monsters and items when include=monsters,items", async () => {
    const mockCollection: Collection = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Collection",
      visibility: "public",
      legendaryCount: 0,
      standardCount: 1,
      creator: fakeCreator,
      monsters: [
        {
          id: "monster-id-1",
          name: "Goblin",
          level: "1",
          levelInt: 1,
          hp: 10,
          legendary: false,
          minion: false,
          armor: "none",
          size: "small",
          speed: 6,
          fly: 0,
          swim: 0,
          climb: 0,
          teleport: 0,
          burrow: 0,
          visibility: "public",
          abilities: [],
          actions: [],
          actionPreface: "",
          creator: fakeCreator,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
        },
      ],
      items: [
        {
          id: "item-id-1",
          name: "Magic Sword",
          kind: "Weapon",
          rarity: "rare",
          visibility: "public",
          description: "A powerful magic sword",
          moreInfo: undefined,
          creator: fakeCreator,
          updatedAt: new Date("2025-01-01"),
        },
      ],
      itemCount: 1,
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicCollectionById.mockResolvedValue(mockCollection);

    const request = new Request(
      "http://localhost:3000/api/collections/my-collection-abc?include=monsters,items"
    );
    const response = await GET(request, createMockParams("my-collection-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("included");
    expect(Array.isArray(data.included)).toBe(true);
    expect(data.included).toHaveLength(2);

    const monsterResource = data.included[0];
    expect(monsterResource.type).toBe("monsters");
    const itemResource = data.included[1];
    expect(itemResource.type).toBe("items");

    expect(data.data.relationships).toHaveProperty("monsters");
    expect(data.data.relationships.monsters.data).toHaveLength(1);
    expect(data.data.relationships).toHaveProperty("items");
    expect(data.data.relationships.items.data).toHaveLength(1);
  });

  it("should return 400 for invalid include parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/collections/my-collection-abc?include=foo"
    );
    const response = await GET(request, createMockParams("my-collection-abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toContain("Only 'monsters' and 'items'");
  });

  it("should include relationships in response", async () => {
    const mockCollection: Collection = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Collection",
      visibility: "public",
      legendaryCount: 0,
      standardCount: 1,
      creator: fakeCreator,
      monsters: [],
      items: [],
      itemCount: 0,
    };

    mockFindPublicCollectionById.mockResolvedValue(mockCollection);

    const request = new Request(
      "http://localhost:3000/api/collections/test-abc"
    );
    const response = await GET(request, createMockParams("test-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    const resource = data.data;
    expect(resource.relationships).toHaveProperty("creator");
    expect(resource.relationships.creator.data.type).toBe("users");
    expect(resource.relationships.creator.data.id).toBe("testuser");
  });
});
