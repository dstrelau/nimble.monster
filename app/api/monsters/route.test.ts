import {
  LegendaryMonsterSchema,
  MonsterSchema,
} from "nimble-schemas/zod/monster";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
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

const { mockPaginateMonsters } = vi.hoisted(() => {
  return { mockPaginateMonsters: vi.fn() };
});

vi.mock("@/lib/services/monsters/repository", async () => {
  return {
    paginateMonsters: mockPaginateMonsters,
  };
});

vi.mock("@/lib/utils/cursor", () => ({
  encodeCursor: vi.fn(
    (data) => `encoded_${data.sort}_${data.value}_${data.id}`
  ),
  decodeCursor: vi.fn((cursor: string) => {
    const match = cursor.match(/^encoded_(-?[^_]+)_(.+)_([^_]+)$/);
    if (!match) return null;
    const [, sort, value, id] = match;
    if (sort === "name" || sort === "-name") {
      return { sort, value, id };
    }
    if (sort === "createdAt" || sort === "-createdAt") {
      return { sort, value, id };
    }
    if (sort === "level" || sort === "-level") {
      return { sort, value: Number(value), id };
    }
    return null;
  }),
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
};

// Allow hp to be optional, since we don't have it.
const TestLegendaryMonsterSchema = LegendaryMonsterSchema.extend({
  bloodied: z
    .object({
      hp: z.int().positive().optional(),
      description: z.string().optional(),
    })
    .optional(),
  lastStand: z
    .object({
      hp: z.int().positive().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

describe("GET /api/monsters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated monsters with default parameters", async () => {
    const mockMonsters = [
      {
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
        saves: "",
      },
    ];

    mockPaginateMonsters.mockResolvedValue({
      data: mockMonsters,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(
      "application/vnd.api+json"
    );
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("monsters");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");

    const result = MonsterSchema.safeParse({
      id: resource.id,
      ...resource.attributes,
    });
    expect(result.success).toBe(true);
  });

  it("should handle cursor pagination", async () => {
    const encodedCursor =
      "encoded_name_Dragon_550e8400-e29b-41d4-a716-446655440001";
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: encodedCursor,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?cursor=encoded_name_Goblin_550e8400-e29b-41d4-a716-446655440000"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.links?.next).toContain(`cursor=${encodedCursor}`);
    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: "encoded_name_Goblin_550e8400-e29b-41d4-a716-446655440000",
      limit: 100,
      sort: "name",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should handle custom limit", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters?limit=50");
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 50,
      sort: "name",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should reject invalid limit", async () => {
    const request = new Request("http://localhost:3000/api/monsters?limit=0");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should reject limit over 1000", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters?limit=1001"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should handle sort by name ascending", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters?sort=name");
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should handle sort by name descending", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=-name"
    );
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-name",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should handle sort by createdAt ascending", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=createdAt"
    );
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "createdAt",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should handle sort by createdAt descending", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=-createdAt"
    );
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-createdAt",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should handle sort by level ascending", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=level"
    );
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "level",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should handle sort by level descending", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=-level"
    );
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-level",
      search: undefined,
      level: undefined,
      includePrivate: false,
    });
  });

  it("should reject invalid sort parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters?sort=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Invalid sort parameter");
  });

  it("should handle search parameter", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?search=dragon"
    );
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
      search: "dragon",
      includePrivate: false,
    });
  });

  it("should handle level parameter", async () => {
    mockPaginateMonsters.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters?level=5");
    await GET(request);

    expect(mockPaginateMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
      level: 5,
      includePrivate: false,
    });
  });

  it("should validate response conforms to MonsterSchema", async () => {
    const mockMonsters = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Dragon",
        level: "10",
        levelInt: 10,
        hp: 200,
        legendary: true,
        minion: false,
        armor: "heavy",
        size: "large",
        speed: 8,
        fly: 12,
        swim: 0,
        climb: 0,
        teleport: 0,
        burrow: 0,
        visibility: "public",
        families: [],
        bloodied: "The dragon roars",
        lastStand: "Final breath",
        abilities: [{ name: "Fire Breath", description: "Breathes fire" }],
        actions: [{ name: "Bite", description: "Bites target" }],
        actionPreface: "",
        creator: fakeCreator,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        saves: "STR++ DEX+",
      },
    ];

    mockPaginateMonsters.mockResolvedValue({
      data: mockMonsters,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters");
    const response = await GET(request);
    const data = await response.json();

    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("monsters");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");

    const result = TestLegendaryMonsterSchema.safeParse({
      id: resource.id,
      ...resource.attributes,
    });
    expect(result.success, JSON.stringify(result.error)).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Dragon");
      expect(result.data.legendary).toBe(true);
      expect(result.data.hp).toBe(200);
      expect(result.data.saves).toEqual({
        all: 0,
        str: 2,
        dex: 1,
        int: 0,
        wil: 0,
      });
    }
  });
});
