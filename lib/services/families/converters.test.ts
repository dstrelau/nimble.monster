import { describe, expect, it } from "vitest";
import type { FamilyOverview } from "@/lib/types";
import { toJsonApiFamily } from "./converters";

describe("toJsonApiFamily", () => {
  const baseFamily: FamilyOverview = {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Goblinoids",
    description: "A family of goblin-like creatures",
    abilities: [],
    creatorId: "user123",
    creator: {
      id: "user123",
      discordId: "discord123",
      username: "testuser",
      displayName: "Test User",
    },
    monsterCount: 5,
  };

  it("should include abilities in attributes", () => {
    const family: FamilyOverview = {
      ...baseFamily,
      abilities: [
        {
          id: "abil-1",
          name: "Pack Tactics",
          description: "Gains advantage when allies are nearby",
        },
        {
          id: "abil-2",
          name: "Nimble Escape",
          description: "Can disengage or hide as a bonus action",
        },
      ],
    };

    const result = toJsonApiFamily(family);

    expect(result.attributes.abilities).toEqual([
      {
        name: "Pack Tactics",
        description: "Gains advantage when allies are nearby",
      },
      {
        name: "Nimble Escape",
        description: "Can disengage or hide as a bonus action",
      },
    ]);
  });

  it("should return empty abilities array when family has no abilities", () => {
    const result = toJsonApiFamily(baseFamily);

    expect(result.attributes.abilities).toEqual([]);
  });

  it("should not include ability ids in the output", () => {
    const family: FamilyOverview = {
      ...baseFamily,
      abilities: [
        {
          id: "abil-1",
          name: "Pack Tactics",
          description: "Gains advantage when allies are nearby",
        },
      ],
    };

    const result = toJsonApiFamily(family);

    expect(result.attributes.abilities[0]).not.toHaveProperty("id");
  });
});
