import { describe, expect, it, vi } from "vitest";
import { getEntityById } from "./entities";

vi.mock("@/lib/db/custom-rule", () => ({
  findPublicCustomRule: vi.fn(async (id: string) => ({
    id,
    name: "House Rule",
  })),
}));

describe("getEntityById", () => {
  it("resolves an official rule slug", async () => {
    await expect(getEntityById("rule", "conditions")).resolves.toEqual({
      id: "conditions",
      name: "Conditions",
      type: "rule",
      href: "/rules/conditions",
    });
  });

  it("links an official variant to its section on the parent rule", async () => {
    await expect(getEntityById("rule", "playing-dead")).resolves.toEqual({
      id: "playing-dead",
      name: "Playing Dead",
      type: "rule",
      href: "/rules/conditions#variant-playing-dead",
    });
  });

  it("falls back to a public custom rule for a rule identifier", async () => {
    await expect(
      getEntityById("rule", "00000000000000000000000001")
    ).resolves.toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      name: "House Rule",
      type: "rule",
    });
  });
});
