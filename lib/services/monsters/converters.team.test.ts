import { describe, expect, it } from "vitest";
import type { User } from "@/lib/types";
import { toJsonApiMonster, toZodMonster } from "./converters";
import type { Monster } from "./types";

const creator: User = {
  id: "00000000-0000-0000-0000-000000000001",
  discordId: "disc",
  username: "creator",
  displayName: "Creator",
};

const teamMonster: Monster = {
  id: "00000000-0000-0000-0000-0000000000aa",
  name: "Kelebek & Poppy",
  kind: "Legendary Bug Druid & His Stinky Pet",
  hp: 0,
  hpPerHero: null,
  legendary: false,
  minion: false,
  level: "3",
  levelInt: 3,
  size: "medium",
  armor: "none",
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  role: null,
  speed: 0,
  fly: 0,
  swim: 0,
  climb: 0,
  teleport: 0,
  burrow: 0,
  saves: "",
  abilities: [
    {
      id: "a1",
      name: "Legendary Duo",
      description: "After each hero's turn, choose Kelebek or Poppy to act.",
    },
  ],
  actions: [],
  actionPreface: "",
  moreInfo: "",
  families: [],
  creator,
  members: [
    {
      id: "m1",
      name: "Kelebek",
      kind: "Entomancer",
      hp: 0,
      hpPerHero: 20,
      armor: "none",
      size: "medium",
      saves: "INT+, WIL+",
      abilities: [],
      actions: [
        { id: "ac1", name: "Vinelash", description: "Move 6, then 2d6." },
      ],
    },
    {
      id: "m2",
      name: "Poppy",
      kind: "Giant Stinkbug",
      hp: 0,
      hpPerHero: 14,
      armor: "medium",
      size: "large",
      saves: "STR+",
      abilities: [{ id: "ab1", name: "Stink Cloud", description: "..." }],
      actions: [
        { id: "ac2", name: "Crushing Mandibles", description: "2d6 damage." },
      ],
    },
  ],
  bloodied: "When Kelebek is bloodied, Poppy always Interposes for him.",
  lastStand: "When Poppy dies, the room fills with noxious gas...",
};

describe("toZodMonster (team)", () => {
  it("emits subtype 'team' with a members array", () => {
    const zod = toZodMonster(teamMonster);
    expect(zod.subtype).toBe("team");
    expect(zod.legendary).toBe(true);
    expect("members" in zod && zod.members).toHaveLength(2);
  });

  it("serializes each member with its own stats", () => {
    const zod = toZodMonster(teamMonster);
    if (!("members" in zod)) throw new Error("expected members");
    const [kelebek, poppy] = zod.members;
    expect(kelebek.name).toBe("Kelebek");
    expect(kelebek.kind).toBe("Entomancer");
    expect(kelebek.hpPerHero).toBe(20);
    expect(kelebek.saves).toEqual({ int: 1, wil: 1 });
    expect(kelebek.actions[0].name).toBe("Vinelash");
    expect(poppy.armor).toBe("medium");
    expect(poppy.abilities[0].name).toBe("Stink Cloud");
  });

  it("includes shared bloodied and lastStand", () => {
    const zod = toZodMonster(teamMonster);
    if (!("bloodied" in zod)) throw new Error("expected bloodied");
    expect(zod.bloodied?.description).toContain("Interposes");
    if (!("lastStand" in zod)) throw new Error("expected lastStand");
    expect(zod.lastStand?.description).toContain("noxious gas");
  });

  it("carries team-level abilities at the top level", () => {
    const zod = toZodMonster(teamMonster);
    expect(zod.abilities[0].name).toBe("Legendary Duo");
  });
});

describe("toJsonApiMonster (team)", () => {
  it("exposes members in attributes and creator relationship", () => {
    const doc = toJsonApiMonster(teamMonster);
    expect(doc.type).toBe("monsters");
    expect("members" in doc.attributes && doc.attributes.members).toHaveLength(
      2
    );
    expect(doc.relationships.creator.data.type).toBe("users");
  });
});
