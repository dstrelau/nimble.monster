import { describe, expect, it } from "vitest";
import { formatWeaponsDisplay } from "./buildClassView.utils";

describe("formatWeaponsDisplay", () => {
  it("returns null for empty weapon spec", () => {
    expect(formatWeaponsDisplay([])).toBeNull();
  });

  it("formats kind, stat, and range into one display string", () => {
    expect(
      formatWeaponsDisplay([
        { kind: "blade" },
        { kind: "wand" },
        { type: "DEX" },
        { range: "ranged" },
      ])
    ).toBe("Blades, Wands / DEX / Ranged");
  });
});
