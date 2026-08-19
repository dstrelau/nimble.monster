import type { Item } from "./types";

export const ITEM_EXAMPLES: Record<string, Omit<Item, "creator">> = {
  Empty: {
    visibility: "public",
    id: "",
    name: "",
    description: "",
    rarity: "unspecified",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "Healing Potion": {
    visibility: "public",
    id: "",
    name: "Greater Healing Potion",
    description:
      "**_ACTION_**. Consume (or administer to an adjacent creature) to heal **3d6+6** HP.",
    imageIcon: "health-potion",
    imageBgIcon: "sparkles",
    imageColor: "pink-700",
    imageBgColor: "red-700",
    imageBackdrop: "icon",
    rarity: "uncommon",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "Gem of Escape": {
    visibility: "public",
    id: "",
    name: "Gem of Escape",
    description:
      "**_ACTION_**. Crush one in case of emergency to instantly teleport ALL who are bound to one to the location of the other gem.",
    moreInfo:
      "These magical gems are always crafted in pairs and can have any number of willing creatures magically bound to them.",
    imageIcon: "emerald",
    imageColor: "violet-600",
    imageBackdrop: "sunburst",
    rarity: "very_rare",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
