import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EncounterOverview } from "@/lib/types";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockFindPublicEncounterById } = vi.hoisted(() => {
  return { mockFindPublicEncounterById: vi.fn() };
});

vi.mock("@/lib/services/encounters/repository", () => ({
  findPublicEncounterById: mockFindPublicEncounterById,
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn((slug: string) => {
    if (slug === "invalid-slug") {
      return null;
    }
    return "550e8400-e29b-41d4-a716-446655440000";
  }),
  uuidToIdentifier: vi.fn((_uuid: string) => {
    return "0psvtrh43w8xm9dfbf5b6nkcq1";
  }),
  slugify: vi.fn(({ name }: { name: string }) => {
    const kebab = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${kebab}-0psvtrh43w8xm9dfbf5b6nkcq1`;
  }),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
};

describe("GET /api/encounters/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return an encounter by id", async () => {
    const mockEncounter: EncounterOverview = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Encounter",
      creator: fakeCreator,
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      monsters: [],
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicEncounterById.mockResolvedValue(mockEncounter);

    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );

    expect(data).toHaveProperty("data");
    const resource = data.data;
    expect(resource.type).toBe("encounters");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");
    expect(resource.attributes.name).toBe("My Encounter");
    expect(resource.attributes.heroCount).toBe(4);
  });

  it("should return 404 for non-existent encounter", async () => {
    mockFindPublicEncounterById.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Encounter not found");
  });

  it("should return 404 for invalid slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/encounters/invalid-slug"
    );
    const response = await GET(request, createMockParams("invalid-slug"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Encounter not found");
  });

  it("should include monsters (with quantity/isPerHero meta) when include=monsters", async () => {
    const mockEncounter: EncounterOverview = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Encounter",
      creator: fakeCreator,
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      monsters: [
        {
          monster: {
            id: "monster-id-1",
            name: "Goblin",
            level: "1",
            levelInt: 1,
            hp: 10,
            hpPerHero: null,
            legendary: false,
            minion: false,
            armor: "none",
            size: "small",
            visibility: "public",
            createdAt: new Date("2025-01-01"),
            role: null,
            isOfficial: false,
          },
          quantity: 3,
          isPerHero: true,
        },
      ],
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicEncounterById.mockResolvedValue(mockEncounter);

    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1?include=monsters"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("included");
    expect(data.included).toHaveLength(1);

    const monsterResource = data.included[0];
    expect(monsterResource.type).toBe("monsters");
    expect(monsterResource.attributes.name).toBe("Goblin");

    expect(data.data.relationships).toHaveProperty("monsters");
    expect(data.data.relationships.monsters.data).toHaveLength(1);
    expect(data.data.relationships.monsters.data[0].meta).toEqual({
      quantity: 3,
      isPerHero: true,
    });
  });

  it("should not include monsters when include parameter is absent", async () => {
    const mockEncounter: EncounterOverview = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "My Encounter",
      creator: fakeCreator,
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      monsters: [],
      createdAt: new Date("2025-01-01"),
    };

    mockFindPublicEncounterById.mockResolvedValue(mockEncounter);

    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).not.toHaveProperty("included");
  });

  it("should return 400 for invalid include parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1?include=foo"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toContain("Only 'monsters' and 'creator'");
  });

  it("should include relationships in response", async () => {
    const mockEncounter: EncounterOverview = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Encounter",
      creator: fakeCreator,
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      monsters: [],
    };

    mockFindPublicEncounterById.mockResolvedValue(mockEncounter);

    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    const resource = data.data;
    expect(resource.relationships).toHaveProperty("creator");
    expect(resource.relationships.creator.data.type).toBe("users");
    expect(resource.relationships.creator.data.id).toBe(
      "0psvtrh43w8xm9dfbf5b6nkcq1"
    );
  });

  it("should include creator resource when include=creator", async () => {
    const mockEncounter: EncounterOverview = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Encounter",
      creator: fakeCreator,
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      monsters: [],
    };

    mockFindPublicEncounterById.mockResolvedValue(mockEncounter);

    const request = new Request(
      "http://localhost:3000/api/encounters/0psvtrh43w8xm9dfbf5b6nkcq1?include=creator"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.included).toBeDefined();
    const creator = data.included.find(
      (r: { type: string }) => r.type === "users"
    );
    expect(creator).toBeDefined();
    expect(creator.id).toBe("0psvtrh43w8xm9dfbf5b6nkcq1");
  });
});
