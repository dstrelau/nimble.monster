import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockListRecentGlobal, mockSearchGlobal } = vi.hoisted(() => ({
  mockListRecentGlobal: vi.fn(),
  mockSearchGlobal: vi.fn(),
}));

vi.mock("@/lib/services/global-search/repository", () => ({
  listRecentGlobal: mockListRecentGlobal,
  MAX_LIMIT: 50,
  searchGlobal: mockSearchGlobal,
}));

import { GET, parseSearchRequest } from "./route";

describe("GET /_actions/search", () => {
  beforeEach(() => {
    mockListRecentGlobal.mockReset();
    mockListRecentGlobal.mockResolvedValue([]);
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
      GET(new Request("http://localhost/_actions/search?type=invalid"))
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      GET(new Request(`http://localhost/_actions/search?q=${"x".repeat(101)}`))
    ).resolves.toMatchObject({ status: 400 });
  });

  it("lists one recent page for a selected type without a query", async () => {
    const parsed = parseSearchRequest(
      new Request("http://localhost/_actions/search?type=monster&limit=12")
    );

    expect(parsed).toEqual({
      query: "",
      type: "monster",
      filters: {
        types: ["monster"],
        limit: 12,
      },
    });

    const response = await GET(
      new Request("http://localhost/_actions/search?type=monster&limit=12")
    );

    expect(response.status).toBe(200);
    expect(mockListRecentGlobal).toHaveBeenCalledWith("monster", 12);
    expect(mockSearchGlobal).not.toHaveBeenCalled();
  });

  it("filters a query to the selected type", async () => {
    await GET(
      new Request(
        "http://localhost/_actions/search?q=frost&type=hazard&limit=12"
      )
    );

    expect(mockSearchGlobal).toHaveBeenCalledWith("frost", {
      types: ["hazard"],
      limit: 12,
    });
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
