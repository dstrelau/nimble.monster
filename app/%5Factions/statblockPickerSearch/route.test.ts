import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockPaginateMyHazards,
  mockPaginateMyMonsters,
  mockPaginateMyItems,
  mockPaginatePublicHazards,
  mockPaginatePublicMonsters,
  mockPaginatePublicItems,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPaginateMyHazards: vi.fn(),
  mockPaginateMyMonsters: vi.fn(),
  mockPaginateMyItems: vi.fn(),
  mockPaginatePublicHazards: vi.fn(),
  mockPaginatePublicMonsters: vi.fn(),
  mockPaginatePublicItems: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/hazards", () => ({
  paginateMyHazards: mockPaginateMyHazards,
  paginatePublicHazards: mockPaginatePublicHazards,
}));
vi.mock("@/lib/services/items", () => ({
  itemsService: {
    paginateMyItems: mockPaginateMyItems,
    paginatePublicItems: mockPaginatePublicItems,
  },
}));
vi.mock("@/lib/services/monsters", () => ({
  monstersService: {
    paginateMyMonsters: mockPaginateMyMonsters,
    paginatePublicMonsters: mockPaginatePublicMonsters,
  },
}));
vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

import { POST } from "./route";

const emptyPage = { data: [], nextCursor: null };

function request(body: unknown) {
  return new Request("http://localhost/_actions/statblockPickerSearch", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPaginateMyHazards.mockResolvedValue(emptyPage);
  mockPaginateMyMonsters.mockResolvedValue(emptyPage);
  mockPaginateMyItems.mockResolvedValue(emptyPage);
  mockPaginatePublicHazards.mockResolvedValue(emptyPage);
  mockPaginatePublicMonsters.mockResolvedValue(emptyPage);
  mockPaginatePublicItems.mockResolvedValue(emptyPage);
});

describe("statblock picker search route", () => {
  it("dispatches public monster searches with creator and filter parameters", async () => {
    const response = await POST(
      request({
        kind: "monsters",
        scope: "public",
        search: "spider",
        sort: "name",
        type: "all",
        source: "GMG",
        role: "ambusher",
        level: 2,
        creatorId: "creator",
        limit: 12,
      })
    );

    expect(response.status).toBe(200);
    expect(mockPaginatePublicMonsters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 12,
      sort: "name",
      search: "spider",
      type: "all",
      source: "GMG",
      role: "ambusher",
      level: 2,
      creatorId: "creator",
    });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("uses the authenticated owner for mine monster searches", async () => {
    mockAuth.mockResolvedValue({ user: { id: "owner" } });

    const response = await POST(
      request({
        kind: "monsters",
        scope: "mine",
        creatorId: "attacker",
        sort: "-createdAt",
        type: "standard",
        limit: 12,
      })
    );

    expect(response.status).toBe(200);
    expect(mockPaginateMyMonsters).toHaveBeenCalledWith("owner", {
      cursor: undefined,
      limit: 12,
      sort: "-createdAt",
      search: undefined,
      type: "standard",
      source: undefined,
      role: undefined,
      level: undefined,
    });
    expect(mockPaginatePublicMonsters).not.toHaveBeenCalled();
  });

  it("dispatches public and owned hazard searches and rejects unauthenticated ownership", async () => {
    const publicResponse = await POST(
      request({
        kind: "hazards",
        scope: "public",
        search: "web",
        sort: "-level",
        creatorId: "creator",
        limit: 12,
      })
    );

    expect(publicResponse.status).toBe(200);
    expect(mockPaginatePublicHazards).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 12,
      sort: "-level",
      search: "web",
      source: undefined,
      level: undefined,
      creatorId: "creator",
    });

    mockAuth.mockResolvedValue(null);
    const mineResponse = await POST(
      request({
        kind: "hazards",
        scope: "mine",
        sort: "-createdAt",
        limit: 12,
      })
    );

    expect(mineResponse.status).toBe(401);
    expect(mockPaginateMyHazards).not.toHaveBeenCalled();
  });

  it("dispatches public and owned item searches with owner isolation", async () => {
    const publicResponse = await POST(
      request({
        kind: "items",
        scope: "public",
        search: "wand",
        sort: "-likes",
        rarity: "rare",
        source: "GMG",
        creatorId: "creator",
        limit: 12,
      })
    );

    expect(publicResponse.status).toBe(200);
    expect(mockPaginatePublicItems).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 12,
      sort: "-likes",
      search: "wand",
      rarity: "rare",
      source: "GMG",
      creatorId: "creator",
    });

    mockAuth.mockResolvedValue({ user: { id: "owner" } });
    const mineResponse = await POST(
      request({
        kind: "items",
        scope: "mine",
        creatorId: "attacker",
        sort: "name",
        rarity: "all",
        limit: 12,
      })
    );

    expect(mineResponse.status).toBe(200);
    expect(mockPaginateMyItems).toHaveBeenCalledWith("owner", {
      cursor: undefined,
      limit: 12,
      sort: "name",
      search: undefined,
      rarity: "all",
      source: undefined,
    });
  });

  it("returns useful errors for invalid input and service failures", async () => {
    const invalidResponse = await POST(
      request({
        kind: "monsters",
        scope: "public",
        sort: "invalid",
        type: "all",
        limit: 12,
      })
    );

    expect(invalidResponse.status).toBe(400);
    expect((await invalidResponse.json()).error).toContain("Invalid option");

    mockPaginatePublicMonsters.mockRejectedValue(
      new Error("Cursor sort mismatch")
    );
    const failedResponse = await POST(
      request({
        kind: "monsters",
        scope: "public",
        sort: "name",
        type: "all",
        limit: 12,
      })
    );

    expect(failedResponse.status).toBe(400);
    expect((await failedResponse.json()).error).toBe("Cursor sort mismatch");
  });
});
