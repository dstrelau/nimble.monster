import type { Companion } from "@/lib/types";

export const EXAMPLE_COMPANIONS: Record<string, Omit<Companion, "creator">> = {
  Stabs: {
    visibility: "public",
    id: "",
    name: "Stabs, the Somewhat Reliable",
    kind: "Kobold",
    class: "The Cheat",
    hp_per_level: "5",
    size: "small",
    saves: "DEX+",
    wounds: 3,
    abilities: [
      {
        id: Math.random().toString(36).slice(2),
        name: "Companion",
        description:
          "Can Interpose for friends (but you'll never hear the end of it!)",
      },
      {
        id: Math.random().toString(36).slice(2),
        name: "Pocket Sand!",
        description:
          "(1/encounter) force an adjacent enemy to reroll an attack with disadvantage.",
      },
    ],
    actions: [
      {
        id: Math.random().toString(36).slice(2),
        name: "Stab!",
        damage: "1d4",
        description:
          "(Advantage VS Distracted targets). On Crit: +LVL damage (instead of rolling additional dice)",
      },
      {
        id: Math.random().toString(36).slice(2),
        name: "Shadowstep",
        damage: "",
        description:
          "Teleport behind an creature you can see (DC 10 WIL save or [[Frightened]] 1 Turn).",
      },
    ],
    actionPreface: "Each turn, move 4 then choose 1:",
    dyingRule:
      "When Stabs drops to 0 HP, he can turn Invisible until the end of his next turn.",
    updatedAt: new Date(),
  },
  empty: {
    visibility: "private",
    id: "",
    name: "",
    kind: "",
    class: "",
    hp_per_level: "",
    size: "medium",
    saves: "",
    wounds: 3,
    abilities: [],
    actions: [],
    actionPreface: "Each turn, choose 1:",
    dyingRule: "",
    updatedAt: new Date(),
  },
};
