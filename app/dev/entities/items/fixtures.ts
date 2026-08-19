import { BACKDROP_OPTIONS } from "@/components/item/colors";
import type { Item } from "@/lib/services/items";
import { RARITIES } from "@/lib/services/items";
import { ITEM_EXAMPLES } from "@/lib/services/items/examples";
import type { Award, Source, User } from "@/lib/types";

const FIXTURE_DATE = new Date("2026-01-15T12:00:00.000Z");

function fixtureId(sequence: number): string {
  return `00000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
}

export const ITEM_LAB_CREATOR: User = {
  id: "item-lab-creator",
  discordId: "",
  username: "fixture-maker",
  displayName: "Fixture Maker",
};

const ITEM_LAB_SOURCE: Source = {
  id: "item-lab-source",
  name: "The Fixture Compendium",
  abbreviation: "TFC",
  license: "CC BY 4.0",
  link: "https://example.com/fixture-compendium",
  createdAt: FIXTURE_DATE,
  updatedAt: FIXTURE_DATE,
};

const ITEM_LAB_AWARD: Award = {
  id: "item-lab-award",
  slug: "fixture-favorite",
  name: "Fixture Favorite",
  abbreviation: "FF",
  description: "Award fixture",
  url: "https://example.com/fixture-favorite",
  color: "amber",
  icon: "award",
  createdAt: FIXTURE_DATE,
  updatedAt: FIXTURE_DATE,
};

function createItem(overrides: Partial<Item>): Item {
  return {
    id: fixtureId(1),
    name: "Adventuring Gear",
    description: "A representative item description.",
    rarity: "unspecified",
    visibility: "public",
    creator: ITEM_LAB_CREATOR,
    createdAt: FIXTURE_DATE,
    updatedAt: FIXTURE_DATE,
    ...overrides,
  };
}

export const ITEM_RARITY_FIXTURES = RARITIES.map((rarity, index) => ({
  label: rarity.label,
  item: createItem({
    id: fixtureId(index + 1),
    name: `${rarity.label} Item`,
    kind: "Wondrous object",
    rarity: rarity.value,
  }),
}));

export const ITEM_BACKDROP_FIXTURES = BACKDROP_OPTIONS.map(
  (backdrop, index) => ({
    label: backdrop.label,
    item: createItem({
      id: fixtureId(index + 10),
      name: `${backdrop.label} Backdrop`,
      kind: "Arcane focus",
      rarity: "rare",
      imageIcon: "emerald",
      imageBgIcon: backdrop.value === "icon" ? "sparkles" : undefined,
      imageColor: "violet-600",
      imageBgColor: "amber-500",
      imageBackdrop: backdrop.value,
    }),
  })
);

export const ITEM_LIST_FIXTURES = ITEM_RARITY_FIXTURES.slice(1, 5).map(
  ({ item }, index) => ({
    ...item,
    imageIcon: index % 2 === 0 ? "emerald" : undefined,
  })
);

export const ITEM_GRID_FIXTURES = ITEM_BACKDROP_FIXTURES.slice(0, 3).map(
  ({ item }, index) => ({
    ...item,
    id: fixtureId(index + 50),
  })
);

export const ITEM_CONTENT_FIXTURES = [
  {
    label: "Minimal fields",
    description: "No kind, image, rarity label, more info, source, or award.",
    item: createItem({
      id: fixtureId(20),
      name: "Rope",
      description: "A sturdy length of rope.",
    }),
  },
  {
    label: "Formatting stress test",
    description: "Actions, emphasis, dice, conditions, links, and a list.",
    item: createItem({
      id: fixtureId(21),
      name: "Manual of Extremely Specific Instructions",
      kind: "Wondrous object (requires patience)",
      rarity: "rare",
      description:
        "_Follow instructions to the letter or suffer the consequences._\n\n**_ACTION_**. Choose one effect:\n\n- Roll **2d6+4** and regain that much HP.\n- Become [[Dazed|dazed]] until the end of your next turn.\n- Read the *fine print* in the [rules](https://example.com/rules).",
      moreInfo:
        "If the result is **12 or higher**, the item also emits bright light for 1 minute.",
    }),
  },
  {
    label: "Long content",
    description: "Wrapping and vertical rhythm under unusually long content.",
    item: createItem({
      id: fixtureId(22),
      name: "The Improbably Long-Named Clockwork Key to the Last Unopened Door",
      kind: "Unique legendary clockwork wondrous object with an unusually descriptive kind",
      rarity: "legendary",
      imageIcon: "emerald",
      imageColor: "amber-700",
      imageBackdrop: "glow",
      description:
        "This key rearranges itself whenever it is observed from a different angle. While carrying it, you can hear a quiet mechanism counting down toward an event whose date, purpose, and consequences have been carefully omitted from every surviving record.",
      moreInfo:
        "The key cannot be duplicated, willingly discarded, or placed inside an extradimensional container. Attempts to do so return it to the owner's pocket at the next dramatically appropriate moment.",
    }),
  },
  {
    label: "Complete footer",
    description: "Creator attribution, source badge, and award badge.",
    item: createItem({
      id: fixtureId(23),
      name: "Prizewinner's Compass",
      kind: "Navigation tool",
      rarity: "very_rare",
      imageIcon: "emerald",
      imageBgIcon: "sparkles",
      imageColor: "blue-600",
      imageBgColor: "amber-500",
      imageBackdrop: "icon",
      source: ITEM_LAB_SOURCE,
      awards: [ITEM_LAB_AWARD],
    }),
  },
  ...Object.entries(ITEM_EXAMPLES)
    .filter(([label]) => label !== "Empty")
    .map(([label, item], index) => ({
      label: `Builder example: ${label}`,
      description: "Shared with the item builder's example loader.",
      item: createItem({ ...item, id: fixtureId(index + 30) }),
    })),
];

const ITEM_STATE_BASE: Partial<Item> = {
  name: "Stateful Shifting Stone",
  kind: "Wondrous object",
  rarity: "uncommon",
  imageIcon: "emerald",
  imageColor: "teal-700",
  imageBackdrop: "motes",
  description:
    "**_ACTION_**. Turn the stone over to inspect another card presentation state.",
  moreInfo: "Used to compare interactive and abbreviated card treatments.",
};

export const ITEM_STATE_FIXTURES = {
  default: createItem({ ...ITEM_STATE_BASE, id: fixtureId(40) }),
  descriptionHidden: createItem({ ...ITEM_STATE_BASE, id: fixtureId(41) }),
  nonInteractive: createItem({ ...ITEM_STATE_BASE, id: fixtureId(42) }),
  selected: createItem({ ...ITEM_STATE_BASE, id: fixtureId(43) }),
};
