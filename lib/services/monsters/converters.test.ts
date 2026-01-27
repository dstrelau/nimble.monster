import { describe, expect, it } from "vitest";
// We need to test the parseSavesString function indirectly through toZodMonster
// since parseSavesString is not exported
import { toZodMonster } from "./converters";
import type { Monster } from "./types";

const createMockMonster = (overrides: Partial<Monster> = {}): Monster => ({
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Monster",
  hp: 10,
  legendary: false,
  minion: false,
  level: "1",
  levelInt: 1,
  visibility: "public",
  size: "medium",
  armor: "none",
  createdAt: new Date(),
  updatedAt: new Date(),
  speed: 6,
  fly: 0,
  swim: 0,
  climb: 0,
  teleport: 0,
  burrow: 0,
  abilities: [],
  actions: [],
  actionPreface: "",
  families: [],
  creator: {
    id: "user-1",
    discordId: "discord-1",
    displayName: "Test User",
    username: "testuser",
  },
  ...overrides,
});

describe("toZodMonster", () => {
  describe("saves parsing", () => {
    it("should return undefined saves when saves is empty", () => {
      const monster = createMockMonster({ saves: "" });
      const result = toZodMonster(monster);
      expect(result.saves).toBeUndefined();
    });

    it("should return undefined saves when saves is undefined", () => {
      const monster = createMockMonster({ saves: undefined });
      const result = toZodMonster(monster);
      expect(result.saves).toBeUndefined();
    });

    it("should parse STR save", () => {
      const monster = createMockMonster({ saves: "STR+" });
      const result = toZodMonster(monster);
      expect(result.saves).toEqual({
        all: 0,
        str: 1,
        dex: 0,
        int: 0,
        wil: 0,
      });
    });

    it("should parse multiple saves", () => {
      const monster = createMockMonster({ saves: "STR+, DEX+" });
      const result = toZodMonster(monster);
      expect(result.saves).toEqual({
        all: 0,
        str: 1,
        dex: 1,
        int: 0,
        wil: 0,
      });
    });

    it("should parse all four saves", () => {
      const monster = createMockMonster({ saves: "STR, DEX, INT, WIL" });
      const result = toZodMonster(monster);
      expect(result.saves).toEqual({
        all: 0,
        str: 1,
        dex: 1,
        int: 1,
        wil: 1,
      });
    });

    it("should parse saves case-insensitively", () => {
      const monster = createMockMonster({ saves: "str, dex" });
      const result = toZodMonster(monster);
      expect(result.saves).toEqual({
        all: 0,
        str: 1,
        dex: 1,
        int: 0,
        wil: 0,
      });
    });

    it("should parse ALL saves", () => {
      const monster = createMockMonster({ saves: "ALL" });
      const result = toZodMonster(monster);
      expect(result.saves).toEqual({
        all: 1,
        str: 0,
        dex: 0,
        int: 0,
        wil: 0,
      });
    });

    it("should return undefined for unrecognized saves string", () => {
      const monster = createMockMonster({ saves: "foo bar" });
      const result = toZodMonster(monster);
      expect(result.saves).toBeUndefined();
    });
  });
});
