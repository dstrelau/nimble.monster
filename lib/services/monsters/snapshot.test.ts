import { describe, expect, it } from "vitest";
import { parseMonsterSnapshot } from "./snapshot";
import type { Monster } from "./types";

const creator = {
  id: "user-1",
  discordId: "discord-1",
  username: "nimble",
  displayName: "Nimble Co.",
};

function buildMonster(): Monster {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    hp: 25,
    hpPerHero: null,
    kind: "Undead",
    legendary: false,
    minion: false,
    level: "3",
    levelInt: 3,
    name: "Skeleton",
    size: "medium",
    armor: "medium",
    visibility: "public",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    role: "melee",
    isOfficial: true,
    saves: "",
    bloodied: "",
    lastStand: "",
    speed: 6,
    fly: 0,
    swim: 0,
    climb: 0,
    teleport: 0,
    burrow: 0,
    abilities: [{ id: "a1", name: "Undead", description: "Immune to poison." }],
    actions: [
      { id: "act1", name: "Claw", damage: "1d6", description: "Slash." },
    ],
    actionPreface: "",
    moreInfo: "",
    mild_encounter: "",
    spicy_encounter: "",
    families: [
      {
        id: "fam-1",
        name: "Undead",
        abilities: [{ id: "fa1", name: "Fearless", description: "No fear." }],
        creatorId: "discord-1",
        creator,
        visibility: "public",
      },
    ],
    creator,
    updatedAt: new Date("2024-02-02T00:00:00.000Z"),
    remixedFromId: null,
    remixedFrom: null,
  };
}

describe("parseMonsterSnapshot", () => {
  it("round-trips a monster through JSON serialization", () => {
    const monster = buildMonster();
    // Simulate storage: JSON in the DB column loses Date types.
    const stored = JSON.parse(JSON.stringify(monster));

    const revived = parseMonsterSnapshot(stored);

    expect(revived).not.toBeNull();
    expect(revived?.name).toBe("Skeleton");
    expect(revived?.hp).toBe(25);
    expect(revived?.families[0].abilities[0].name).toBe("Fearless");
    expect(revived?.actions[0].damage).toBe("1d6");
    // Dates are revived as Date instances, not left as strings.
    expect(revived?.createdAt).toBeInstanceOf(Date);
    expect(revived?.createdAt.getTime()).toBe(
      new Date("2024-01-01T00:00:00.000Z").getTime()
    );
    expect(revived?.updatedAt).toBeInstanceOf(Date);
  });

  it("returns null for a null payload", () => {
    expect(parseMonsterSnapshot(null)).toBeNull();
  });

  it("returns null for an empty object (missing required fields)", () => {
    expect(parseMonsterSnapshot({})).toBeNull();
  });

  it("returns null when an enum value is invalid", () => {
    const stored = JSON.parse(JSON.stringify(buildMonster()));
    stored.size = "colossal";
    expect(parseMonsterSnapshot(stored)).toBeNull();
  });
});
