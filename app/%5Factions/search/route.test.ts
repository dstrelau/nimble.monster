import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSearchGlobal } = vi.hoisted(() => ({
  mockSearchGlobal: vi.fn(),
}));

vi.mock("@/lib/services/global-search/repository", () => ({
  MAX_LIMIT: 50,
  searchGlobal: mockSearchGlobal,
}));

import { GET, parseSearchRequest } from "./route";

describe("GET /_actions/search", () => {
  beforeEach(() => {
    mockSearchGlobal.mockReset();
    mockSearchGlobal.mockResolvedValue([]);
  });

  it("validates query and result bounds", async () => {
    await expect(
      GET(new Request("http://localhost/_actions/search"))
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      GET(new Request("http://localhost/_actions/search?q=one&limit=51"))
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      GET(new Request(`http://localhost/_actions/search?q=${"x".repeat(101)}`))
    ).resolves.toMatchObject({ status: 400 });
  });

  it("parses the query and limit", () => {
    const parsed = parseSearchRequest(
      new Request("http://localhost/_actions/search?q=frost%20trap&limit=7")
    );

    expect(parsed).toEqual({
      query: "frost trap",
      filters: {
        limit: 7,
      },
    });
  });

  it("returns the compact shared result contract", async () => {
    mockSearchGlobal.mockResolvedValue([
      {
        type: "monster",
        id: "monster-1",
        name: "Frostbite",
        href: "/monsters/frostbite-1",
      },
    ]);

    const response = await GET(
      new Request("http://localhost/_actions/search?q=frost")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: [
        {
          type: "monster",
          id: "monster-1",
          name: "Frostbite",
          href: "/monsters/frostbite-1",
        },
      ],
    });
    expect(mockSearchGlobal).toHaveBeenCalledWith("frost", {
      limit: 20,
    });
  });
});
