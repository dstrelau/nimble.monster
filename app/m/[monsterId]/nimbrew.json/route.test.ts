import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Monster } from "@/lib/types";
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

vi.mock("@/lib/db", () => ({
  findMonster: vi.fn(),
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

vi.mock("@/lib/utils/monster", () => ({
  formatSizeKind: vi.fn(() => "Medium Humanoid"),
}));

vi.mock("@/lib/utils/validation", () => ({
  isValidUUID: vi.fn(),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockFindMonster = vi.mocked(await import("@/lib/db")).findMonster;
const mockIsValidUUID = vi.mocked(
  await import("@/lib/utils/validation")
).isValidUUID;
const mockFormatSizeKind = vi.mocked(
  await import("@/lib/utils/monster")
).formatSizeKind;

describe("GET /m/[monsterId]/nimbrew.json", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = new Request("http://localhost:3000");
  const createMockParams = (monsterId: string) => ({
    params: Promise.resolve({ monsterId }),
  });

  it("should return 404 for invalid UUID", async () => {
    mockIsValidUUID.mockReturnValue(false);

    const response = await GET(mockRequest, createMockParams("invalid-id"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Monster not found" });
  });

  it("should return 404 when monster not found", async () => {
    mockIsValidUUID.mockReturnValue(true);
    mockFindMonster.mockResolvedValue(null);

    const response = await GET(
      mockRequest,
      createMockParams("550e8400-e29b-41d4-a716-446655440000")
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Monster not found" });
  });

  it("should return 404 for private monster when user is not owner", async () => {
    mockIsValidUUID.mockReturnValue(true);
    mockFindMonster.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Monster",
      visibility: "private",
      creator: { discordId: "owner123" },
      level: "1",
      hp: 50,
      legendary: false,
      minion: false,
      armor: "none",
      speed: 6,
      saves: [],
      size: "medium",
      fly: 0,
      swim: 0,
      climb: 0,
      teleport: 0,
      burrow: 0,
      abilities: [],
      actions: [],
      actionPreface: "",
      updatedAt: "",
      conditions: [],
    } satisfies Partial<Monster>);
    mockAuth.mockResolvedValue({
      user: { id: "different-user" },
    });

    const response = await GET(
      mockRequest,
      createMockParams("550e8400-e29b-41d4-a716-446655440000")
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Monster not found" });
  });

  it("should return nimbrew data for public monster", async () => {
    mockIsValidUUID.mockReturnValue(true);
    mockFormatSizeKind.mockReturnValue("Medium Humanoid");

    const mockMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Goblin",
      visibility: "public",
      creator: { discordId: "owner123" },
      level: "3",
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
      saves: ["Dex", "Wis"],
      family: {
        abilities: [
          {
            name: "Pack Tactics",
            description: "Has advantage when ally is adjacent",
          },
        ],
      },
      abilities: [
        { name: "Nimble Escape", description: "Can disengage as bonus action" },
      ],
      actions: [
        {
          name: "Shortsword",
          damage: "1d6+2",
          description: "Melee weapon attack",
        },
        {
          name: "Shortbow",
          damage: "1d6+2",
          description: "Ranged weapon attack",
        },
      ],
      actionPreface: "The goblin makes two attacks",
      updatedAt: "",
      conditions: [],
    } satisfies Partial<Monster>;

    mockFindMonster.mockResolvedValue(mockMonster);

    const response = await GET(
      mockRequest,
      createMockParams("550e8400-e29b-41d4-a716-446655440000")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Test Goblin");
    expect(data.CR).toBe("Lvl 3 Medium Humanoid");
    expect(data.armor).toBe("");
    expect(data.hp).toBe("25");
    expect(data.saves).toEqual(["Dex", "Wis"]);
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
    mockIsValidUUID.mockReturnValue(true);
    mockFormatSizeKind.mockReturnValue("Large Dragon");

    const mockMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Ancient Dragon",
      visibility: "private",
      creator: { discordId: "owner123" },
      level: "15",
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
      saves: ["Str", "Con", "Wis", "Cha"],
      bloodied: "The dragon roars in fury",
      lastStand: "The dragon makes one final desperate attack",
      family: null,
      abilities: [],
      actions: [
        {
          name: "Bite",
          damage: "2d10+8",
          description: "Melee weapon attack",
        },
      ],
      actionPreface: "",
      updatedAt: "",
      conditions: [],
    } satisfies Partial<Monster>;

    mockFindMonster.mockResolvedValue(mockMonster);
    mockAuth.mockResolvedValue({
      user: { id: "owner123" },
    });

    const response = await GET(
      mockRequest,
      createMockParams("550e8400-e29b-41d4-a716-446655440000")
    );
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
    mockIsValidUUID.mockReturnValue(true);
    mockFormatSizeKind.mockReturnValue("Small Beast");

    const mockMonster = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Rat",
      visibility: "public",
      creator: { discordId: "owner123" },
      level: "1",
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
      saves: [],
      family: null,
      abilities: [],
      actions: [
        {
          name: "Bite",
          damage: "1",
          description: "Melee weapon attack",
        },
      ],
      actionPreface: "",
      updatedAt: "",
      conditions: [],
    } satisfies Partial<Monster>;

    mockFindMonster.mockResolvedValue(mockMonster);

    const response = await GET(
      mockRequest,
      createMockParams("550e8400-e29b-41d4-a716-446655440000")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.armor).toBe("");
    expect(data.actions).toHaveLength(1);
    expect(data.actions[0].type).toBe("single");
    expect(data.actions[0].name).toBe("Bite");
  });
});
