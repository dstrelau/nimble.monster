import { describe, expect, it } from "vitest";
import { getEntityImageVersion } from "./entity-image-version";

describe("getEntityImageVersion", () => {
  it("is stable across object key order", () => {
    const updatedAt = new Date("2026-08-19T18:30:00.000Z");

    expect(getEntityImageVersion({ name: "Rope", updatedAt })).toBe(
      getEntityImageVersion({ updatedAt, name: "Rope" })
    );
  });

  it("changes when rendered entity content changes", () => {
    const entity = {
      name: "Rope",
      updatedAt: new Date("2026-08-19T18:30:00.000Z"),
      awards: [{ abbreviation: "GMG" }],
      families: [{ abilities: [{ name: "Quick" }] }],
    };

    expect(
      getEntityImageVersion({
        ...entity,
        awards: [{ abbreviation: "Core" }],
      })
    ).not.toBe(getEntityImageVersion(entity));
    expect(
      getEntityImageVersion({
        ...entity,
        families: [{ abilities: [{ name: "Faster" }] }],
      })
    ).not.toBe(getEntityImageVersion(entity));
  });
});
