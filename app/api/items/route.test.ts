import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/lib/services/items/types";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockPaginatePublicItems } = vi.hoisted(() => {
  return { mockPaginatePublicItems: vi.fn() };
});

vi.mock("@/lib/services/items", () => ({
  itemsService: {
    paginatePublicItems: mockPaginatePublicItems,
  },
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
};

const makeItem = (id: string, name: string, creator = fakeCreator): Item => ({
  id,
  name,
  rarity: "common",
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  description: "desc",
  creator,
});

describe("GET /api/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a list of items", async () => {
    mockPaginatePublicItems.mockResolvedValue({
      data: [makeItem("11111111-1111-1111-1111-111111111111", "Sword")],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/items");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.included).toBeUndefined();
  });

  it("includes deduplicated creators when include=creator", async () => {
    const otherCreator = {
      id: "87654321-4321-4321-4321-0987654321ba",
      discordId: "user456",
      username: "other",
      displayName: "Other User",
    };
    mockPaginatePublicItems.mockResolvedValue({
      data: [
        makeItem("11111111-1111-1111-1111-111111111111", "Sword"),
        makeItem("22222222-2222-2222-2222-222222222222", "Shield"),
        makeItem("33333333-3333-3333-3333-333333333333", "Bow", otherCreator),
      ],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/items?include=creator"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.included).toBeDefined();
    const users = data.included.filter(
      (r: { type: string }) => r.type === "users"
    );
    expect(users).toHaveLength(2);
  });

  it("rejects an invalid include parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/items?include=bogus"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors[0].title).toContain("Only 'creator' is supported");
  });
});
