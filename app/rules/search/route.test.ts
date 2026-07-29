import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSearchPublicCustomRules } = vi.hoisted(() => ({
  mockSearchPublicCustomRules: vi.fn(),
}));

vi.mock("@/lib/db/custom-rule", () => ({
  searchPublicCustomRules: mockSearchPublicCustomRules,
}));

import { GET } from "./route";

describe("GET /rules/search", () => {
  beforeEach(() => {
    mockSearchPublicCustomRules.mockReset();
    mockSearchPublicCustomRules.mockResolvedValue([]);
  });

  it("finds a combined rule by a curated section keyword", async () => {
    const response = await GET(
      new Request("http://localhost/rules/search?q=Finesse")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0]).toMatchObject({
      slug: "skills",
      title: "Skills",
    });
  });

  it("finds a condition on the combined conditions page", async () => {
    const response = await GET(
      new Request("http://localhost/rules/search?q=Poisoned")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0]).toMatchObject({
      slug: "conditions",
      title: "Conditions",
    });
  });

  it("uses curated keywords instead of incidental body text", async () => {
    const lightResponse = await GET(
      new Request("http://localhost/rules/search?q=light")
    );
    const lightResults = (await lightResponse.json()).results.map(
      (result: { title: string }) => result.title
    );
    expect(lightResults).toEqual([
      "Weapon Properties",
      "Armor & Defense",
      "Dual Wielding",
    ]);

    const strengthResponse = await GET(
      new Request("http://localhost/rules/search?q=strength")
    );
    const strengthResults = (await strengthResponse.json()).results.map(
      (result: { title: string }) => result.title
    );
    expect(strengthResults).toEqual([
      "Stats",
      "What if I have negative STR during a Field Rest?",
    ]);
  });

  it("links an official FAQ to its rule-page callout", async () => {
    const response = await GET(
      new Request("http://localhost/rules/search?q=Warding%20Bond")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0]).toMatchObject({
      slug: "defend",
      title: "Can you Defend against Warding Bond?",
      faqKind: "official",
      anchor: "faq-warding-bond",
    });
  });

  it("labels GM guidance results", async () => {
    const response = await GET(
      new Request("http://localhost/rules/search?q=Monster%20Builder")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0]).toMatchObject({
      slug: "monster-builder",
      group: "gm-guidance",
      category: "monsters",
    });
  });

  it("finds public custom rules by keyword", async () => {
    mockSearchPublicCustomRules.mockResolvedValue([
      {
        id: "01911111-1111-7111-8111-111111111111",
        name: "Heroic Initiative",
        content: "Roll initiative as normal.",
        keywords: "popcorn turn order",
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/rules/search?q=popcorn&includeHomebrew=true"
      )
    );
    const body = await response.json();

    expect(mockSearchPublicCustomRules).toHaveBeenCalledWith("popcorn", 2);
    expect(body.results).toContainEqual(
      expect.objectContaining({
        title: "Heroic Initiative",
        customRule: true,
        href: expect.stringMatching(/^\/custom-rules\//),
      })
    );
  });

  it("excludes homebrew rules by default", async () => {
    const response = await GET(
      new Request("http://localhost/rules/search?q=popcorn")
    );
    const body = await response.json();

    expect(mockSearchPublicCustomRules).not.toHaveBeenCalled();
    expect(body.results).not.toContainEqual(
      expect.objectContaining({ customRule: true })
    );
  });

  it("returns no results for an empty query", async () => {
    const response = await GET(new Request("http://localhost/rules/search"));
    await expect(response.json()).resolves.toEqual({ results: [] });
    expect(mockSearchPublicCustomRules).not.toHaveBeenCalled();
  });
});
