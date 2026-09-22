import { describe, expect, it } from "vitest";
import { getEntityImageVersion } from "./entity-image-version";

describe("getEntityImageVersion", () => {
  it("is stable across object key order", () => {
    const updatedAt = new Date("2026-08-19T18:30:00.000Z");

    expect(getEntityImageVersion({ name: "Rope", updatedAt })).toBe(
      getEntityImageVersion({ updatedAt, name: "Rope" })
    );
  });

  it("ignores transient IDs added while converting entity content", () => {
    const entity = {
      id: "monster-a",
      name: "Rope",
      abilities: [{ id: "ability-a", name: "Entangle" }],
      members: [
        {
          id: "member-a",
          actions: [{ id: "action-a", name: "Constrict" }],
        },
      ],
    };

    expect(
      getEntityImageVersion({
        ...entity,
        id: "monster-b",
        abilities: [{ id: "ability-b", name: "Entangle" }],
        members: [
          {
            id: "member-b",
            actions: [{ id: "action-b", name: "Constrict" }],
          },
        ],
      })
    ).toBe(getEntityImageVersion(entity));
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
