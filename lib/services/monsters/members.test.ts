import { describe, expect, it } from "vitest";
import {
  collectMemberConditionSources,
  parseMembers,
  stripMemberIds,
} from "./members";
import type { MonsterTeamMember } from "./types";

describe("parseMembers", () => {
  it("returns [] for null/empty", () => {
    expect(parseMembers(null)).toEqual([]);
    expect(parseMembers(undefined)).toEqual([]);
    expect(parseMembers("[]")).toEqual([]);
  });

  it("parses a JSON string column and assigns ids", () => {
    const stored = JSON.stringify([
      {
        name: "Kelebek",
        hpPerHero: 20,
        armor: "none",
        size: "medium",
        saves: "INT+, WIL+",
        abilities: [],
        actions: [{ name: "Vinelash", description: "Move 6, then 2d6." }],
      },
    ]);

    const members = parseMembers(stored);
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe("Kelebek");
    expect(members[0].hpPerHero).toBe(20);
    expect(members[0].armor).toBe("none");
    expect(members[0].id).toBeTruthy();
    expect(members[0].actions[0].id).toBeTruthy();
    expect(members[0].actions[0].name).toBe("Vinelash");
  });

  it("applies defaults for missing fields", () => {
    const members = parseMembers([{ name: "Blob" }]);
    expect(members[0]).toMatchObject({
      name: "Blob",
      hp: 0,
      hpPerHero: null,
      armor: "none",
      size: "medium",
      abilities: [],
      actions: [],
    });
  });

  it("accepts an already-parsed array", () => {
    const members = parseMembers([
      { name: "A", abilities: [{ name: "x", description: "y" }], actions: [] },
    ]);
    expect(members[0].abilities[0].id).toBeTruthy();
    expect(members[0].abilities[0].name).toBe("x");
  });
});

describe("stripMemberIds", () => {
  it("drops member and nested ability/action ids", () => {
    const members: MonsterTeamMember[] = [
      {
        id: "m1",
        name: "Poppy",
        hp: 0,
        hpPerHero: 14,
        armor: "medium",
        size: "large",
        saves: "STR+",
        actionPreface: "",
        abilities: [{ id: "a1", name: "Stink Cloud", description: "..." }],
        actions: [{ id: "ac1", name: "Crush", description: "..." }],
      },
    ];

    const stripped = stripMemberIds(members);
    const first = stripped[0];
    expect(first).not.toHaveProperty("id");
    expect(first?.abilities?.[0]).not.toHaveProperty("id");
    expect(first?.actions?.[0]).not.toHaveProperty("id");
    expect(first?.name).toBe("Poppy");
    expect(first?.hpPerHero).toBe(14);
  });

  it("round-trips through parseMembers", () => {
    const original = parseMembers([
      {
        name: "A",
        hpPerHero: 10,
        armor: "heavy",
        size: "huge",
        abilities: [{ name: "Ab", description: "d" }],
        actions: [{ name: "Ac", description: "d2" }],
      },
    ]);
    const reparsed = parseMembers(stripMemberIds(original));
    expect(reparsed[0].name).toBe("A");
    expect(reparsed[0].hpPerHero).toBe(10);
    expect(reparsed[0].armor).toBe("heavy");
    expect(reparsed[0].abilities[0].name).toBe("Ab");
    expect(reparsed[0].actions[0].name).toBe("Ac");
  });

  it("returns [] for undefined", () => {
    expect(stripMemberIds(undefined)).toEqual([]);
  });
});

describe("collectMemberConditionSources", () => {
  it("flattens member actions and abilities", () => {
    const members = parseMembers([
      {
        name: "A",
        abilities: [{ name: "ab1", description: "d1" }],
        actions: [{ name: "ac1", description: "d2" }],
      },
      {
        name: "B",
        abilities: [],
        actions: [{ name: "ac2", description: "d3" }],
      },
    ]);
    const sources = collectMemberConditionSources(members);
    expect(sources.abilities).toHaveLength(1);
    expect(sources.actions).toHaveLength(2);
  });

  it("returns empty arrays for undefined", () => {
    expect(collectMemberConditionSources(undefined)).toEqual({
      actions: [],
      abilities: [],
    });
  });
});
