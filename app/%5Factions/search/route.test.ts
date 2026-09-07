import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockSearchGlobal } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSearchGlobal: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/services/global-search/repository", () => ({
  MAX_LIMIT: 50,
  searchGlobal: mockSearchGlobal,
}));

import { GET, parseSearchRequest } from "./route";

describe("GET /_actions/search", () => {
  beforeEach(() => {
    mockAuth.mockReset();
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

  it("passes type and creator filters to the service", () => {
    const parsed = parseSearchRequest(
      new Request(
        "http://localhost/_actions/search?q=frost%20trap&types=monster,hazard&creatorId=creator-1&limit=7"
      )
    );

    expect(parsed).toEqual({
      query: "frost trap",
      filters: {
        types: ["monster", "hazard"],
        creatorId: "creator-1",
        limit: 7,
      },
      scope: "all",
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
      types: undefined,
      limit: 20,
    });
  });

  it("uses the authenticated user for My Library searches", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await GET(
      new Request("http://localhost/_actions/search?q=frost&scope=mine")
    );

    expect(response.status).toBe(200);
    expect(mockSearchGlobal).toHaveBeenCalledWith("frost", {
      types: undefined,
      creatorId: "user-1",
      limit: 20,
    });
  });

  it("rejects unauthenticated My Library searches", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/_actions/search?q=frost&scope=mine")
    );

    expect(response.status).toBe(401);
    expect(mockSearchGlobal).not.toHaveBeenCalled();
  });

  it("rejects unknown or duplicate types", async () => {
    const unknown = await GET(
      new Request("http://localhost/_actions/search?q=frost&types=unknown")
    );
    const duplicate = await GET(
      new Request("http://localhost/_actions/search?q=frost&types=rule,rule")
    );

    expect(unknown.status).toBe(400);
    expect(duplicate.status).toBe(400);
  });
});
