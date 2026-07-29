import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /rules/search", () => {
  it("returns section-aware rule results", async () => {
    const response = await GET(
      new Request("http://localhost/rules/search?q=Finesse")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0]).toMatchObject({
      slug: "skills",
      title: "Finesse (DEX)",
      anchor: "finesse-dex",
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
      title: "Poisoned",
      anchor: "poisoned",
    });
  });

  it("returns no results for an empty query", async () => {
    const response = await GET(new Request("http://localhost/rules/search"));
    await expect(response.json()).resolves.toEqual({ results: [] });
  });
});
