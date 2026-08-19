import { describe, expect, it } from "vitest";
import { FORMATTED_TEXT_ENTITY_CATALOG } from "./catalog";

describe("text-formatting entity catalog", () => {
  it("catalogs every entity type that renders FormattedText", () => {
    expect(FORMATTED_TEXT_ENTITY_CATALOG.map((entry) => entry.entity)).toEqual([
      "Monster",
      "Hazard",
      "Companion",
      "Item",
      "Family",
      "Ancestry",
      "Background",
      "Class",
      "Subclass",
      "Spell school",
      "Collection",
      "Encounter",
      "Adventure",
      "Custom rule",
    ]);
  });

  it("records the intentionally compact call sites", () => {
    const compactFields = FORMATTED_TEXT_ENTITY_CATALOG.flatMap((entry) =>
      entry.fields
        .filter((field) => field.mode === "compact")
        .map((field) => `${entry.entity}: ${field.name}`)
    );

    expect(compactFields).toEqual([
      "Subclass: Tagline",
      "Spell school: Spell description",
      "Collection: Card-preview description",
      "Encounter: Card-preview description",
    ]);
  });
});
