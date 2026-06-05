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

const { mockGetPublicItem } = vi.hoisted(() => {
  return { mockGetPublicItem: vi.fn() };
});

vi.mock("@/lib/services/items", () => ({
  itemsService: {
    getPublicItem: mockGetPublicItem,
  },
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn((slug: string) => {
    if (slug === "invalid-slug") {
      return null;
    }
    return "550e8400-e29b-41d4-a716-446655440000";
  }),
  uuidToIdentifier: vi.fn((_uuid: string) => "0psvtrh43w8xm9dfbf5b6nkcq1"),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
};

const makeItem = (): Item => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Sword",
  rarity: "common",
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  description: "desc",
  creator: fakeCreator,
});

const createMockParams = (id: string) => ({
  params: Promise.resolve({ id }),
});

describe("GET /api/items/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an item by id", async () => {
    mockGetPublicItem.mockResolvedValue(makeItem());

    const request = new Request(
      "http://localhost:3000/api/items/0psvtrh43w8xm9dfbf5b6nkcq1"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.type).toBe("items");
    expect(data.data.relationships.creator.data.type).toBe("users");
    expect(data.included).toBeUndefined();
  });

  it("includes creator resource when include=creator", async () => {
    mockGetPublicItem.mockResolvedValue(makeItem());

    const request = new Request(
      "http://localhost:3000/api/items/0psvtrh43w8xm9dfbf5b6nkcq1?include=creator"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.included).toBeDefined();
    expect(data.included[0].type).toBe("users");
    expect(data.included[0].id).toBe("0psvtrh43w8xm9dfbf5b6nkcq1");
  });

  it("rejects an invalid include parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/items/0psvtrh43w8xm9dfbf5b6nkcq1?include=bogus"
    );
    const response = await GET(
      request,
      createMockParams("0psvtrh43w8xm9dfbf5b6nkcq1")
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors[0].title).toContain("Only 'creator' is supported");
  });
});
