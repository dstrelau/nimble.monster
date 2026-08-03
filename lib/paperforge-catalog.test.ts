import { describe, expect, it } from "vitest";
import { PAPERFORGE_ENTRIES } from "./paperforge-catalog";

describe("Paperforge catalog", () => {
  it("contains normalized names", () => {
    for (const entry of PAPERFORGE_ENTRIES) {
      expect(entry.name).toBe(entry.name.trim());
      expect(entry.name).not.toMatch(/^\[Fanart\]/i);
    }

    expect(PAPERFORGE_ENTRIES.find((entry) => entry.id === "760")?.name).toBe(
      "Ulitharid [Fanart]"
    );
  });
});
