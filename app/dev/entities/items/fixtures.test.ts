import { describe, expect, it } from "vitest";
import { BACKDROP_OPTIONS } from "@/components/item/colors";
import { RARITIES } from "@/lib/services/items";
import {
  ITEM_BACKDROP_FIXTURES,
  ITEM_CONTENT_FIXTURES,
  ITEM_GRID_FIXTURES,
  ITEM_LIST_FIXTURES,
  ITEM_RARITY_FIXTURES,
  ITEM_STATE_FIXTURES,
} from "./fixtures";

describe("item lab fixtures", () => {
  it("covers every supported rarity", () => {
    expect(ITEM_RARITY_FIXTURES.map(({ item }) => item.rarity)).toEqual(
      RARITIES.map(({ value }) => value)
    );
  });

  it("covers every supported image backdrop", () => {
    expect(
      ITEM_BACKDROP_FIXTURES.map(({ item }) => item.imageBackdrop)
    ).toEqual(BACKDROP_OPTIONS.map(({ value }) => value));
  });

  it("keeps the item builder examples represented", () => {
    const labels = ITEM_CONTENT_FIXTURES.map(({ label }) => label);

    expect(labels).toContain("Builder example: Healing Potion");
    expect(labels).toContain("Builder example: Gem of Escape");
  });

  it("covers list rows with and without icons", () => {
    expect(ITEM_LIST_FIXTURES.some((item) => item.imageIcon)).toBe(true);
    expect(ITEM_LIST_FIXTURES.some((item) => !item.imageIcon)).toBe(true);
  });

  it("uses unique IDs across independently rendered cards", () => {
    const ids = [
      ...ITEM_RARITY_FIXTURES.map(({ item }) => item.id),
      ...ITEM_BACKDROP_FIXTURES.map(({ item }) => item.id),
      ...ITEM_CONTENT_FIXTURES.map(({ item }) => item.id),
      ...ITEM_GRID_FIXTURES.map((item) => item.id),
      ...Object.values(ITEM_STATE_FIXTURES).map((item) => item.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
