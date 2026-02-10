import { describe, expect, it } from "vitest";
import { toCompanion } from "./converters";

const baseCompanionRow = {
  id: "test-id",
  name: "Test Companion",
  kind: "Wolf",
  class: "Hunter",
  hpPerLevel: "5",
  wounds: 3,
  size: "medium",
  saves: "DEX+",
  visibility: "public",
  abilities: "[]",
  actions: "[]",
  actionPreface: "Each turn, choose 1:",
  dyingRule: "When this companion drops to 0 HP, it is dead.",
  moreInfo: null,
  paperforgeId: null,
  updatedAt: "2024-01-01T00:00:00.000Z",
  creator: {
    id: "user-id",
    discordId: "discord-id",
    username: "testuser",
    displayName: "Test User",
    imageUrl: null,
    avatar: null,
  },
  source: null,
  companionAwards: [],
};

describe("toCompanion", () => {
  it("converts a companion row with paperforgeId", () => {
    const row = { ...baseCompanionRow, paperforgeId: "42" };
    const result = toCompanion(row);
    expect(result.paperforgeId).toBe("42");
  });

  it("converts paperforgeId null to undefined", () => {
    const row = { ...baseCompanionRow, paperforgeId: null };
    const result = toCompanion(row);
    expect(result.paperforgeId).toBeUndefined();
  });

  it("converts paperforgeId empty string to undefined", () => {
    const row = { ...baseCompanionRow, paperforgeId: "" };
    const result = toCompanion(row);
    expect(result.paperforgeId).toBeUndefined();
  });

  it("preserves other companion fields correctly", () => {
    const result = toCompanion(baseCompanionRow);
    expect(result.id).toBe("test-id");
    expect(result.name).toBe("Test Companion");
    expect(result.kind).toBe("Wolf");
    expect(result.class).toBe("Hunter");
    expect(result.hp_per_level).toBe("5");
    expect(result.wounds).toBe(3);
    expect(result.size).toBe("medium");
    expect(result.saves).toBe("DEX+");
    expect(result.visibility).toBe("public");
    expect(result.dyingRule).toBe(
      "When this companion drops to 0 HP, it is dead."
    );
    expect(result.creator.username).toBe("testuser");
  });
});
