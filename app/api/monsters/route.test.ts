import { MonsterSchema } from "nimble-schemas/zod/monster";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const { mockListPublicMonsters } = vi.hoisted(() => {
  return { mockListPublicMonsters: vi.fn() };
});

vi.mock("@/lib/services/monsters/repository", () => ({
  listPublicMonsters: mockListPublicMonsters,
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

const mockListMonsters = mockListPublicMonsters;

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
};

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
        abilities: [],
        actions: [],
        actionPreface: "",
        creator: fakeCreator,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        saves: "",
      },
    ];

    mockListMonsters.mockResolvedValue({
      monsters: mockMonsters,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.nimble.v202510+json"
    );
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("nextCursor");
    expect(data.nextCursor).toBeNull();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(1);

    const result = MonsterSchema.safeParse(data.data[0]);
    expect(result.success).toBe(true);
  });

  it("should handle cursor pagination", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: "550e8400-e29b-41d4-a716-446655440001",
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?cursor=550e8400-e29b-41d4-a716-446655440000"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.nextCursor).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
      limit: 100,
      sort: "name",
    });
  });

  it("should handle custom limit", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters?limit=50");
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 50,
      sort: "name",
    });
  });

  it("should reject invalid limit", async () => {
    const request = new Request("http://localhost:3000/api/monsters?limit=0");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Limit must be between 1 and 1000");
  });

  it("should reject limit over 1000", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters?limit=1001"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Limit must be between 1 and 1000");
  });

  it("should handle sort by name ascending", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters?sort=name");
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
    });
  });

  it("should handle sort by name descending", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=-name"
    );
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-name",
    });
  });

  it("should handle sort by created_at ascending", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=created_at"
    );
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "created_at",
    });
  });

  it("should handle sort by created_at descending", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=-created_at"
    );
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-created_at",
    });
  });

  it("should handle sort by level ascending", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=level"
    );
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "level",
    });
  });

  it("should handle sort by level descending", async () => {
    mockListMonsters.mockResolvedValue({
      monsters: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/monsters?sort=-level"
    );
    await GET(request);

    expect(mockListMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-level",
    });
  });

  it("should reject invalid sort parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters?sort=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid sort parameter");
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
        bloodied: "The dragon roars",
        lastStand: "Final breath",
        abilities: [{ name: "Fire Breath", description: "Breathes fire" }],
        actions: [{ name: "Bite", description: "Bites target" }],
        actionPreface: "",
        creator: fakeCreator,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        saves: "STR DEX",
      },
    ];

    mockListMonsters.mockResolvedValue({
      monsters: mockMonsters,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/monsters");
    const response = await GET(request);
    const data = await response.json();

    expect(data.data).toHaveLength(1);

    const result = MonsterSchema.safeParse(data.data[0]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Dragon");
      expect(result.data.legendary).toBe(true);
      expect(result.data.hp).toBe(200);
    }
  });
});
