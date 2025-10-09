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

const { mockGetMonster } = vi.hoisted(() => {
  return { mockGetMonster: vi.fn() };
});

vi.mock("@/lib/services/monsters", () => ({
  monstersService: {
    getMonster: mockGetMonster,
  },
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
    const mockMonster: Partial<Monster> = {
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
    };

    mockGetMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/goblin-abc"
    );
    const response = await GET(request, createMockParams("goblin-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.nimble.v202510+json"
    );

    const result = MonsterSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Goblin");
      expect(result.data.hp).toBe(10);
      expect(result.data.legendary).toBe(false);
    }
  });

  it("should return 404 for non-existent monster", async () => {
    mockGetMonster.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/monsters/nonexistent"
    );
    const response = await GET(request, createMockParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Monster not found");
  });

  it("should return 404 for invalid slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/monsters/invalid-slug"
    );
    const response = await GET(request, createMockParams("invalid-slug"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Monster not found");
  });

  it("should validate legendary monster conforms to MonsterSchema", async () => {
    const mockMonster: Partial<Monster> = {
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
      saves: "STR CON WIS",
    };

    mockGetMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/ancient-dragon-abc"
    );
    const response = await GET(request, createMockParams("ancient-dragon-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);

    const result = MonsterSchema.safeParse(data);
    expect(result.success).toBe(true);
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
    const mockMonster: Partial<Monster> = {
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
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      saves: "",
    };

    mockGetMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/water-elemental-abc"
    );
    const response = await GET(
      request,
      createMockParams("water-elemental-abc")
    );
    const data = await response.json();

    expect(response.status).toBe(200);

    const result = MonsterSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.movement).toEqual(
        expect.arrayContaining([{ speed: 4 }, { mode: "swim", speed: 12 }])
      );
    }
  });

  it("should handle fractional level monsters", async () => {
    const mockMonster: Partial<Monster> = {
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
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: fakeCreator,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      saves: "",
    };

    mockGetMonster.mockResolvedValue(mockMonster);

    const request = new Request(
      "http://localhost:3000/api/monsters/tiny-rat-abc"
    );
    const response = await GET(request, createMockParams("tiny-rat-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);

    const result = MonsterSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe("1/4");
    }
  });
});
