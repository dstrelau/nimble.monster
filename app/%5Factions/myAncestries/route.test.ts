import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeCursor } from "@/lib/utils/cursor";

const { mockAuth, mockPaginate } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPaginate: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/ancestries/repository", () => ({
  paginatePublicAncestries: mockPaginate,
}));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "owner-id" } });
  mockPaginate.mockResolvedValue({ data: [], nextCursor: null });
});

describe("GET /_actions/myAncestries", () => {
  it("uses session ownership and validates filters and cursor rather than trusting creatorId", async () => {
    const cursor = encodeCursor({
      sort: "name",
      value: "Moonborn",
      id: "ancestry-id",
    });
    const query = new URLSearchParams({
      sort: "name",
      limit: "2",
      search: "moon",
      source: "HB",
      cursor,
      creatorId: "other-user",
    });
    mockPaginate.mockResolvedValue({
      data: [
        {
          id: "ancestry-id",
          visibility: "private",
          createdAt: new Date("2026-09-01T00:00:00Z"),
        },
      ],
      nextCursor: "next",
    });
    const response = await GET(
      new Request(`http://localhost/_actions/myAncestries?${query}`)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(mockPaginate).toHaveBeenCalledWith(
      {
        sort: "name",
        limit: 2,
        search: "moon",
        source: "HB",
        cursor,
        creatorId: "owner-id",
      },
      true
    );
    expect(await response.json()).toEqual({
      data: [
        {
          id: "ancestry-id",
          visibility: "private",
          createdAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      nextCursor: "next",
    });
  });

  it("requires authentication", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(
      new Request("http://localhost/_actions/myAncestries")
    );
    expect(response.status).toBe(401);
    expect(mockPaginate).not.toHaveBeenCalled();
  });

  it.each([
    "limit=0",
    "limit=101",
    "limit=1.5",
    "sort=invalid",
    "cursor=invalid",
    `sort=name&cursor=${encodeCursor({ sort: "-createdAt", value: "2026-09-01", id: "id" })}`,
  ])("rejects invalid pagination: %s", async (query) => {
    const response = await GET(
      new Request(`http://localhost/_actions/myAncestries?${query}`)
    );
    expect(response.status).toBe(400);
    expect(mockPaginate).not.toHaveBeenCalled();
  });

  it("hides unexpected internal errors", async () => {
    mockPaginate.mockRejectedValue(new Error("Sensitive database details"));
    const response = await GET(
      new Request("http://localhost/_actions/myAncestries")
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
