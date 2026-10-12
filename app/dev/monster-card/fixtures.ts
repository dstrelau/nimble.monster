import type { Monster } from "@/lib/services/monsters";

// Snapshot of the public Troll Hunter card, including its original punctuation:
// https://nimble.nexus/monsters/troll-hunter-24k8fzpnyn9cztqw0x7gsrakfq
export const TROLL_HUNTER: Monster = {
  id: "449a1ffb-57d5-4b3f-abf0-1d3c33854df7",
  name: "Troll Hunter",
  hp: 90,
  legendary: false,
  minion: false,
  hazard: false,
  level: "10",
  levelInt: 10,
  visibility: "public",
  size: "large",
  armor: "medium",
  paperforgeId: "526",
  createdAt: new Date("2025-03-30T13:51:16.183Z"),
  updatedAt: new Date("2026-02-03T22:49:13.848Z"),
  kind: "humanoid (giant) - artillery/brute",
  speed: 6,
  fly: 0,
  swim: 0,
  climb: 0,
  teleport: 0,
  burrow: 0,
  abilities: [
    {
      id: "c79b04c6-6c35-4d4c-9471-e4f7a8ff3318",
      name: "Damage Interactions",
      description: "Fire (V), Acid (V)",
    },
    {
      id: "90113a74-427a-443c-ab3a-c039e7b44cd7",
      name: "Troll Blood",
      description:
        "Regains 10HP every turn. Does not die at 0HP. This ability is supressed for 1 turn after taking fire or acid damage.",
    },
    {
      id: "d88f4837-1b03-4779-a51f-d03862c5371b",
      name: "Blend in",
      description:
        "Weaknesses of Trolls are known far and wide. Troll Hunters disguise themself in a big cloak to hide their troll nature until they are engaged in melee.",
    },
  ],
  actions: [
    {
      id: "5f33ac8c-e913-4546-b425-5cbb936c6b39",
      name: "Heavy Crossbow",
      damage: "(Range 2-12) 2d10+10 piercing.",
      description: "On damage: Prone.",
    },
    {
      id: "5d265435-c06d-4058-add7-33b7b09ea3cc",
      name: "Claw (2x)",
      damage: "2d6+8 slashing.",
      description: "",
    },
    {
      id: "0858c369-2ad0-402e-8b24-eff1e4e2e76b",
      name: "Bite",
      damage: "4d8+12 piercing.",
      description: "",
    },
  ],
  actionPreface: "Choose one.",
  moreInfo: "Made by SanityWithIn for Monster Monday Week 9: Forest.",
  families: [],
  creator: {
    id: "ce3f2e61-62ce-4589-ba8b-da3c93630c0d",
    discordId: "317711883568414722",
    username: "sanitywithin",
    displayName: "SanityWithIn",
  },
};
