import type { Session } from "next-auth";
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from "vitest";
import type { Monster } from "@/lib/services/monsters";
import { GET } from "./route";

// Mock dependencies
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

vi.mock("@/lib/utils/monster", () => ({
  formatSizeKind: vi.fn(() => "Medium Humanoid"),
}));

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn(),
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn(),
  slugify: vi.fn(),
}));

vi.mock("@/lib/utils/url", () => ({
  getMonsterUrl: vi.fn(() => "/monsters/test-monster-abc123"),
}));

// Can't for the life of me figure out how to get these types to work...
// biome-ignore lint/suspicious/noExplicitAny: ???
const mockAuth: MockedFunction<any> = vi.mocked(
  await import("@/lib/auth")
).auth;
const mockFindMonster = mockGetMonster;
const mockFormatSizeKind = vi.mocked(
  await import("@/lib/utils/monster")
).formatSizeKind;
const mockDeslugify = vi.mocked(await import("@/lib/utils/slug")).deslugify;
const mockSlugify = vi.mocked(await import("@/lib/utils/slug")).slugify;
const _mockPermanentRedirect = vi.mocked(
  await import("next/navigation")
).permanentRedirect;

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "owner123",
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
};

describe("GET /monsters/[id]/nimbrew.json", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = new Request("http://localhost:3000");
  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return 404 for invalid UUID", async () => {
    mockDeslugify.mockImplementation(() => {
      return null;
    });

    const response = await GET(mockRequest, createMockParams("invalid-id"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Monster not found" });
  });

  it("should return 404 when monster not found", async () => {
    mockDeslugify.mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
    mockFindMonster.mockResolvedValue(null);

    const response = await GET(
      mockRequest,
      createMockParams("test-monster-abcdefghijklmnopqrstuvwxyz")
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Monster not found" });
  });

  it("should return 404 for private monster when user is not owner", async () => {
    const testMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Monster",
      visibility: "private",
      creator: fakeCreator,
      level: "1",
      levelInt: 1,
      hp: 50,
      legendary: false,
      minion: false,
      armor: "none",
      speed: 6,
      saves: "",
      size: "medium",
      fly: 0,
      swim: 0,
      climb: 0,
      teleport: 0,
      burrow: 0,
      abilities: [],
      actions: [],
      actionPreface: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Partial<Monster>;

    const slug = "test-monster-abcdefghijklmnopqrstuvwxyz";
    mockDeslugify.mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
    mockSlugify.mockReturnValue(slug);
    mockFindMonster.mockResolvedValue(testMonster);
    mockAuth.mockResolvedValue({
      user: { id: "different-user" },
    } as Session);

    const response = await GET(mockRequest, createMockParams(slug));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Monster not found" });
  });

  it("should return nimbrew data for public monster", async () => {
    mockFormatSizeKind.mockReturnValue("Medium Humanoid");

    const mockMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Goblin",
      visibility: "public",
      creator: fakeCreator,
      level: "3",
      levelInt: 3,
      hp: 25,
      legendary: false,
      minion: false,
      armor: "none",
      size: "small",
      speed: 8,
      swim: 4,
      fly: 0,
      climb: 6,
      burrow: 0,
      teleport: 0,
      saves: "Dex, Wis",
      families: [
        {
          id: "family1",
          name: "Goblinoid",
          creatorId: "owner123",
          creator: fakeCreator,
          abilities: [
            {
              id: "test-ability-1",
              name: "Pack Tactics",
              description: "Has advantage when ally is adjacent",
            },
          ],
        },
      ],
      abilities: [
        {
          id: "test-ability-2",
          name: "Nimble Escape",
          description: "Can disengage as bonus action",
        },
      ],
      actions: [
        {
          id: "test-id-1",
          name: "Shortsword",
          damage: "1d6+2",
          description: "Melee weapon attack",
        },
        {
          id: "test-id-2",
          name: "Shortbow",
          damage: "1d6+2",
          description: "Ranged weapon attack",
        },
      ],
      actionPreface: "The goblin makes two attacks",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Partial<Monster>;

    const slug = "test-goblin-abcdefghijklmnopqrstuvwxyz";
    mockDeslugify.mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
    mockSlugify.mockReturnValue(slug);
    mockFindMonster.mockResolvedValue(mockMonster);

    const response = await GET(mockRequest, createMockParams(slug));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Test Goblin");
    expect(data.CR).toBe("Lvl 3 Medium Humanoid");
    expect(data.armor).toBe("");
    expect(data.hp).toBe("25");
    expect(data.saves).toBe("Dex, Wis");
    expect(data.speed).toBe("8, Swim 4, Climb 6");
    expect(data.passives).toHaveLength(2);
    expect(data.passives[0].name).toBe("Pack Tactics");
    expect(data.passives[1].name).toBe("Nimble Escape");
    expect(data.actions).toHaveLength(1);
    expect(data.actions[0].type).toBe("multi");
    expect(data.actions[0].name).toBe("The goblin makes two attacks");
    expect(data.actions[0].actions).toHaveLength(2);
    expect(data.theme).toBeDefined();

    // Check CORS headers
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type"
    );
  });

  it("should return nimbrew data for private monster when user is owner", async () => {
    mockFormatSizeKind.mockReturnValue("Large Dragon");

    const mockMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Ancient Dragon",
      visibility: "private",
      creator: fakeCreator,
      level: "15",
      levelInt: 15,
      hp: 200,
      legendary: true,
      minion: false,
      armor: "heavy",
      size: "large",
      speed: 0,
      fly: 0,
      swim: 0,
      climb: 0,
      teleport: 0,
      burrow: 0,
      saves: "Str, Con, Wis, Cha",
      bloodied: "The dragon roars in fury",
      lastStand: "The dragon makes one final desperate attack",
      families: [],
      abilities: [],
      actions: [
        {
          id: "test-id-3",
          name: "Bite",
          damage: "2d10+8",
          description: "Melee weapon attack",
        },
      ],
      actionPreface: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Partial<Monster>;

    const slug = "ancient-dragon-abcdefghijklmnopqrstuvw";
    mockDeslugify.mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
    mockSlugify.mockReturnValue(slug);
    mockFindMonster.mockResolvedValue(mockMonster);
    mockAuth.mockResolvedValue({
      user: { discordId: "owner123" },
    });

    const response = await GET(mockRequest, createMockParams(slug));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Ancient Dragon");
    expect(data.CR).toBe("Level 15 Solo Large Dragon");
    expect(data.armor).toBe("H");
    expect(data.bloodied).toBe("The dragon roars in fury");
    expect(data.laststand).toBe("The dragon makes one final desperate attack");
    expect(data.actions).toHaveLength(1);
    expect(data.actions[0].type).toBe("single");
  });

  it("should handle monster with single action", async () => {
    mockFormatSizeKind.mockReturnValue("Small Beast");

    const mockMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Rat",
      visibility: "public",
      creator: fakeCreator,
      level: "1",
      levelInt: 1,
      hp: 1,
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
      saves: "",
      families: [],
      abilities: [],
      actions: [
        {
          id: "test-id-4",
          name: "Bite",
          damage: "1",
          description: "Melee weapon attack",
        },
      ],
      actionPreface: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Partial<Monster>;

    const slug = "rat-abcdefghijklmnopqrstuvwxyz";
    mockDeslugify.mockReturnValue("550e8400-e29b-41d4-a716-446655440000");
    mockSlugify.mockReturnValue(slug);
    mockFindMonster.mockResolvedValue(mockMonster);

    const response = await GET(mockRequest, createMockParams(slug));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.armor).toBe("");
    expect(data.actions).toHaveLength(1);
    expect(data.actions[0].type).toBe("single");
    expect(data.actions[0].name).toBe("Bite");
  });
});
