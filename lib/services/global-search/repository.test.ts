import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getClient: () => ({ execute: mockExecute }),
}));

vi.mock("@/lib/rules/filesystem", () => ({
  getAllRules: () => [],
}));

vi.mock("@/lib/rules/faqs", () => ({
  getAllRuleFaqs: () => [],
  ruleFaqUrl: () => "/rules/test",
}));

import { searchGlobal } from "./repository";

const exactNameId = "11111111-1111-4111-8111-111111111111";
const bodyMatchId = "22222222-2222-4222-8222-222222222222";
const creatorId = "33333333-3333-4333-8333-333333333333";

function catalogRow(
  values: Partial<{
    entity_type: string;
    entity_id: string;
    creator_id: string | null;
    creator_name: string;
    creator_username: string;
    name: string;
    subtitle: string;
    keywords: string;
    summary: string;
    body: string;
    rank: number;
    paperforge_id: string | null;
    image_icon: string | null;
  }> = {}
) {
  return {
    entity_type: "monster",
    entity_id: exactNameId,
    creator_id: null,
    creator_name: "",
    creator_username: "",
    name: "Frostbite",
    subtitle: "",
    keywords: "",
    summary: "",
    body: "",
    rank: 0,
    paperforge_id: null,
    image_icon: null,
    ...values,
  };
}

describe("global search repository", () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockExecute.mockResolvedValue({ rows: [] });
  });

  it("ranks exact and prefix names above lower-weight body matches", async () => {
    mockExecute.mockResolvedValue({
      rows: [
        catalogRow(),
        catalogRow({
          entity_id: bodyMatchId,
          name: "Glacier Wyrm",
          body: "Its frostbite attack freezes the ground.",
        }),
      ],
    });

    const results = await searchGlobal("frostbite", { limit: 10 });

    expect(results.map((result) => result.id)).toEqual([
      exactNameId,
      bodyMatchId,
    ]);
    expect(results[0]).toMatchObject({
      href: expect.stringMatching(/^\/monsters\/frostbite-/),
      matchedField: "name",
    });
    expect(results[1]?.matchedField).toBe("body");
  });

  it("constructs a safe multi-term prefix MATCH expression", async () => {
    mockExecute.mockResolvedValue({
      rows: [catalogRow({ name: "Frost Dragon" })],
    });

    await searchGlobal("fros dra", { limit: 10 });

    const statement = mockExecute.mock.calls[0]?.[0];
    expect(statement).toMatchObject({
      args: expect.arrayContaining(['"fros"* AND "dra"*']),
    });
    expect(statement.sql).toContain("global_search_fts MATCH ?");
  });

  it("does not overstate a cross-field multi-term match", async () => {
    mockExecute.mockResolvedValue({
      rows: [
        catalogRow({
          name: "Frost Wyrm",
          body: "This dragon hunts at night.",
        }),
      ],
    });

    const [result] = await searchGlobal("frost dragon");

    expect(result?.matchedField).toBeUndefined();
  });

  it("passes type and creator filters to the public catalog query", async () => {
    await searchGlobal("frost", {
      types: ["hazard", "rule"],
      creatorId,
      limit: 7,
    });

    const statement = mockExecute.mock.calls[0]?.[0];
    expect(statement.sql).toContain("catalog.visibility = ?");
    expect(statement.sql).toContain("catalog.entity_type IN (?, ?)");
    expect(statement.sql).toContain("catalog.creator_id = ?");
    expect(statement.args).toEqual([
      "public",
      '"frost"*',
      "hazard",
      "rule",
      creatorId,
      7,
    ]);
  });

  it("uses canonical hazard URLs and creator summaries", async () => {
    mockExecute.mockResolvedValue({
      rows: [
        catalogRow({
          entity_type: "hazard",
          entity_id: creatorId,
          name: "Frost Trap",
          creator_id: creatorId,
          creator_name: "Dungeon Smith",
          creator_username: "dungeon-smith",
        }),
      ],
    });

    const [result] = await searchGlobal("frost");

    expect(result).toMatchObject({
      type: "hazard",
      href: expect.stringMatching(/^\/hazards\/frost-trap-/),
      creator: {
        id: creatorId,
        name: "Dungeon Smith",
        username: "dungeon-smith",
      },
    });
  });

  it("returns available monster and item image identifiers", async () => {
    mockExecute.mockResolvedValue({
      rows: [
        catalogRow({ paperforge_id: "5" }),
        catalogRow({
          entity_type: "item",
          entity_id: bodyMatchId,
          name: "Frost Wand",
          image_icon: "emerald",
        }),
      ],
    });

    const results = await searchGlobal("frost");

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paperforgeId: "5" }),
        expect.objectContaining({ imageIcon: "emerald" }),
      ])
    );
  });
});
