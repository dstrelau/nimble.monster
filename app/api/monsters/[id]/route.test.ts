import { MonsterSchema } from "nimble-schemas/zod/monster";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Monster } from "@/lib/services/monsters";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { mockGetPublicMonster } = vi.hoisted(() => {
  return { mockGetPublicMonster: vi.fn() };
});

vi.mock("@/lib/services/monsters", () => ({
  monstersService: {
    getPublicMonster: mockGetPublicMonster,
  },
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
  uuidToIdentifier: vi.fn(() => {
    return "0psvtrh43w8xm9dfbf5b6nkcq1";
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/utils/url", () => ({
  getMonsterUrl: vi.fn(),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
};

describe("GET /api/monsters/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return a monster by slug", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
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
      families: [],
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/goblin-abc"
    );
    const response = await GET(request, createMockParams("goblin-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );

    expect(data).toHaveProperty("data");
    const resource = data.data;
    expect(resource.type).toBe("monsters");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");

    const result = MonsterSchema.safeParse({
      id: resource.id,
      ...resource.attributes,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Goblin");
      expect(result.data.hp).toBe(10);
      expect(result.data.legendary).toBe(false);
    }

    expect(resource).not.toHaveProperty("relationships");
  });

  it("should include family relationships when monster has families", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
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
      families: [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Goblinoids",
          abilities: [],
          creatorId: "user123",
          creator: fakeCreator,
        },
      ],
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/goblin-abc"
    );
    const response = await GET(request, createMockParams("goblin-abc"));
    const data = await response.json();

    const resource = data.data;
    expect(resource.relationships.families.data).toHaveLength(1);
    expect(resource.relationships.families.data[0].type).toBe("families");
    expect(resource.relationships.families.data[0]).toHaveProperty("id");
    expect(resource.attributes).not.toHaveProperty("families");
  });

  it("should return 404 for non-existent monster", async () => {
    mockGetPublicMonster.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/monsters/nonexistent"
    );
    const response = await GET(request, createMockParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Monster not found");
  });

  it("should return 404 for invalid slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters/invalid-slug"
    );
    const response = await GET(request, createMockParams("invalid-slug"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Monster not found");
  });

  it("should validate legendary monster conforms to MonsterSchema", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Ancient Dragon",
      level: "15",
      levelInt: 15,
      hp: 400,
      legendary: true,
      minion: false,
      armor: "heavy",
      size: "huge",
      speed: 10,
      fly: 20,
      swim: 0,
      climb: 0,
      teleport: 0,
      burrow: 0,
      visibility: "public",
      families: [],
      bloodied: "The dragon roars in fury",
      lastStand: "Makes a final desperate attack",
      abilities: [
        { id: "1", name: "Dragon Breath", description: "Breathes fire" },
      ],
      actions: [{ id: "2", name: "Bite", description: "Powerful bite attack" }],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/ancient-dragon-abc"
    );
    const response = await GET(request, createMockParams("ancient-dragon-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);

    expect(data).toHaveProperty("data");
    const resource = data.data;
    expect(resource.type).toBe("monsters");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");

    const result = MonsterSchema.safeParse({
      id: resource.id,
      ...resource.attributes,
    });
    expect(result.success, JSON.stringify(result.error)).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ancient Dragon");
      expect(result.data.legendary).toBe(true);
      expect(result.data.hp).toBe(400);
      if (result.data.legendary) {
        expect(result.data.bloodied.description).toBe(
          "The dragon roars in fury"
        );
        expect(result.data.lastStand.description).toBe(
          "Makes a final desperate attack"
        );
      }
    }
  });

  it("should handle monster with multiple movement modes", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Water Elemental",
      level: "5",
      levelInt: 5,
      hp: 80,
      legendary: false,
      minion: false,
      armor: "none",
      size: "large",
      speed: 4,
      fly: 0,
      swim: 12,
      climb: 0,
      teleport: 0,
      burrow: 0,
      visibility: "public",
      families: [],
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/water-elemental-abc"
    );
    const response = await GET(
      request,
      createMockParams("water-elemental-abc")
    );
    const data = await response.json();

    expect(response.status).toBe(200);

    expect(data).toHaveProperty("data");
    const resource = data.data;

    const result = MonsterSchema.safeParse({
      id: resource.id,
      ...resource.attributes,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.movement).toEqual(
        expect.arrayContaining([{ speed: 4 }, { mode: "swim", speed: 12 }])
      );
    }
  });

  it("should handle fractional level monsters", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Tiny Rat",
      level: "1/4",
      levelInt: -4,
      hp: 2,
      legendary: false,
      minion: false,
      armor: "none",
      size: "tiny",
      speed: 6,
      fly: 0,
      swim: 0,
      climb: 0,
      teleport: 0,
      burrow: 0,
      visibility: "public",
      families: [],
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/tiny-rat-abc"
    );
    const response = await GET(request, createMockParams("tiny-rat-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);

    expect(data).toHaveProperty("data");
    const resource = data.data;

    const result = MonsterSchema.safeParse({
      id: resource.id,
      ...resource.attributes,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe("1/4");
    }
  });

  it("should include families in included when include=families", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
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
      families: [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Goblinoids",
          abilities: [],
          creatorId: "user123",
          creator: fakeCreator,
        },
      ],
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/goblin-abc?include=families"
    );
    const response = await GET(request, createMockParams("goblin-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.included).toHaveLength(1);
    expect(data.included[0].type).toBe("families");
    expect(data.included[0].attributes.name).toBe("Goblinoids");
  });

  it("should not include families when include is not specified", async () => {
    const mockMonster: Monster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
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
      families: [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Goblinoids",
          abilities: [],
          creatorId: "user123",
          creator: fakeCreator,
        },
      ],
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    mockGetPublicMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/goblin-abc"
    );
    const response = await GET(request, createMockParams("goblin-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).not.toHaveProperty("included");
  });

  it("should reject invalid include parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters/goblin-abc?include=invalid"
    );
    const response = await GET(request, createMockParams("goblin-abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors[0].title).toContain("Invalid include parameter");
  });
});
