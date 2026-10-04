import { type RandomTable, UNKNOWN_USER } from "@/lib/types";

export const STRESS_TEST_TABLE: RandomTable = {
  id: "",
  creator: UNKNOWN_USER,
  name: "Random Table Layout Stress Test",
  description: "Wide columns, long content, dice text, and linked monsters.",
  visibility: "public",
  subtables: [
    {
      title: "Expanded Weapons Catalog",
      columns: [
        { id: "roll", name: "1d100" },
        { id: "weapon", name: "Weapon" },
        { id: "price", name: "Price" },
        { id: "damage", name: "Damage" },
        { id: "range", name: "Range" },
        { id: "hands", name: "Hands" },
        { id: "weight", name: "Weight" },
        { id: "trait", name: "Trait" },
        { id: "rarity", name: "Rarity" },
        { id: "notes", name: "Notes" },
      ],
      rows: [
        {
          cells: {
            roll: "01–20",
            weapon: "Dagger",
            price: "5 gp",
            damage: "1d4",
            range: "Melee / 20 ft.",
            hands: "1",
            weight: "1 lb.",
            trait: "Finesse",
            rarity: "Common",
            notes: "A balanced blade suitable for **concealed carry**.",
          },
        },
        {
          cells: {
            roll: "21–40",
            weapon: "Longbow",
            price: "50 gp",
            damage: "1d8",
            range: "150/600 ft.",
            hands: "2",
            weight: "2 lb.",
            trait: "Ammunition",
            rarity: "Common",
            notes: "Tall yew bow with a waxed hemp string.",
          },
        },
        {
          cells: {
            roll: "41–70",
            weapon: "Warhammer",
            price: "25 gp",
            damage: "1d10",
            range: "Melee",
            hands: "1 or 2",
            weight: "3 lb.",
            trait: "Versatile",
            rarity: "Uncommon",
            notes: "The pommel bears a faded royal crest.",
          },
        },
        {
          cells: {
            roll: "71–100",
            weapon: "Arcane greatsword",
            price: "150 gp",
            damage: "2d6",
            range: "Melee",
            hands: "2",
            weight: "6 lb.",
            trait: "Heavy",
            rarity: "Rare",
            notes: "Blue runes flare when danger approaches.",
          },
        },
      ],
    },
    {
      title: "Monster Encounters",
      columns: [
        { id: "roll", name: "1d12" },
        { id: "monsters", name: "Monsters" },
        { id: "number", name: "Number" },
        { id: "terrain", name: "Terrain" },
        { id: "complication", name: "Complication" },
      ],
      rows: [
        {
          cells: {
            roll: "1–3",
            monsters: "@monster:[12rt8ahtsz93svk6vbffvbh72g|Goblin Minion]",
            number: "2d4",
            terrain: "Old road",
            complication: "A wagon blocks the narrowest approach.",
          },
        },
        {
          cells: {
            roll: "4–6",
            monsters:
              "@monster:[4d11ghfd838178qcr63jfdjs70|Goblin] and @monster:[6gsmqqkqc38vyagrtswex90f8z|Goblin Ratrider]",
            number: "1d4 + 1",
            terrain: "Rocky pass",
            complication: "The scout begins on the ridge above.",
          },
        },
        {
          cells: {
            roll: "7–9",
            monsters: "@monster:[594csxk61996gadjc6j2qpkpxw|Skeleton]",
            number: "2d6",
            terrain: "Ruined shrine",
            complication: "Holy ground shifts after each round.",
          },
        },
        {
          cells: {
            roll: "10–12",
            monsters: "@monster:[2r59d941zn9n882pj3khycg197|Ogre Zombie]",
            number: "1",
            terrain: "Flooded ditch",
            complication: "Deep mud covers the center.",
          },
        },
      ],
    },
    {
      title: "Treasure Parcels",
      columns: [
        { id: "roll", name: "2d6" },
        { id: "container", name: "Container" },
        { id: "coins", name: "Coins" },
        { id: "valuables", name: "Valuables" },
        { id: "magic", name: "Magic" },
        { id: "detail", name: "Hidden Detail" },
      ],
      rows: [
        {
          cells: {
            roll: "2–4",
            container: "Iron lockbox",
            coins: "3d10 gp",
            valuables: "Two moonstones",
            magic: "None",
            detail: "A false bottom contains a coded map.",
          },
        },
        {
          cells: {
            roll: "5–8",
            container: "Merchant satchel",
            coins: "6d6 sp",
            valuables: "Silver trade bars",
            magic: "Minor charm",
            detail: "A guild seal identifies the owner.",
          },
        },
        {
          cells: {
            roll: "9–12",
            container: "Buried cedar chest",
            coins: "5d20 gp",
            valuables: "Jeweled cup",
            magic: "Rare item",
            detail: "Opening it rings a distant warning bell.",
          },
        },
      ],
    },
    {
      title: "Changing Weather",
      columns: [
        { id: "roll", name: "1d8" },
        { id: "conditions", name: "Conditions" },
        { id: "visibility", name: "Visibility" },
        { id: "travel", name: "Travel" },
      ],
      rows: [
        {
          cells: {
            roll: "1–2",
            conditions: "Clear and cold",
            visibility: "Excellent",
            travel: "Normal",
          },
        },
        {
          cells: {
            roll: "3–5",
            conditions: "Driving rain",
            visibility: "Poor",
            travel: "Half speed",
          },
        },
        {
          cells: {
            roll: "6–7",
            conditions: "Dense silver fog",
            visibility: "Very poor",
            travel: "Navigation check",
          },
        },
        {
          cells: {
            roll: "8",
            conditions: "Violent thunderstorm",
            visibility: "Near zero",
            travel: "Travel stops",
          },
        },
      ],
    },
    {
      title: "Traveling NPCs",
      columns: [
        { id: "roll", name: "1d10" },
        { id: "name", name: "Name" },
        { id: "role", name: "Role" },
        { id: "mood", name: "Mood" },
      ],
      rows: [
        {
          cells: {
            roll: "1–3",
            name: "Mara Venn",
            role: "Courier",
            mood: "Suspicious",
          },
        },
        {
          cells: {
            roll: "4–6",
            name: "Old Fen",
            role: "Tinker",
            mood: "Cheerful",
          },
        },
        {
          cells: {
            roll: "7–8",
            name: "Sister Elian",
            role: "Pilgrim",
            mood: "Exhausted",
          },
        },
        {
          cells: {
            roll: "9–10",
            name: "Captain Rusk",
            role: "Deserter",
            mood: "Desperate",
          },
        },
      ],
    },
  ],
};
