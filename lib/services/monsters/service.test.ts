import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Monster } from "./types";
import { monstersService } from "./service";

const mockFindMonster = vi.fn();

vi.mock("./repository", () => ({
  findMonster: (...args: unknown[]) => mockFindMonster(...args),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
};

describe("getPublicOrPrivateMonsterForUser", () => {
  const monsterId = "550e8400-e29b-41d4-a716-446655440000";

  const publicMonster: Monster = {
    id: monsterId,
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

  const privateMonster: Monster = {
    ...publicMonster,
    name: "Secret Goblin",
    visibility: "private",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when findMonster returns null", async () => {
    mockFindMonster.mockResolvedValue(null);

    const result = await monstersService.getPublicOrPrivateMonsterForUser(
      monsterId,
      fakeCreator.discordId
    );

    expect(result).toBeNull();
    expect(mockFindMonster).toHaveBeenCalledWith(monsterId);
  });

  it("returns public monster for any discordId", async () => {
    mockFindMonster.mockResolvedValue(publicMonster);

    const result = await monstersService.getPublicOrPrivateMonsterForUser(
      monsterId,
      undefined
    );

    expect(result).toEqual(publicMonster);
  });

  it("returns private monster when discordId matches creator", async () => {
    mockFindMonster.mockResolvedValue(privateMonster);

    const result = await monstersService.getPublicOrPrivateMonsterForUser(
      monsterId,
      fakeCreator.discordId
    );

    expect(result).toEqual(privateMonster);
  });

  it("returns null for private monster when discordId is undefined", async () => {
    mockFindMonster.mockResolvedValue(privateMonster);

    const result = await monstersService.getPublicOrPrivateMonsterForUser(
      monsterId,
      undefined
    );

    expect(result).toBeNull();
  });

  it("returns null for private monster when discordId does not match creator", async () => {
    mockFindMonster.mockResolvedValue(privateMonster);

    const result = await monstersService.getPublicOrPrivateMonsterForUser(
      monsterId,
      "other-discord"
    );

    expect(result).toBeNull();
  });
});
