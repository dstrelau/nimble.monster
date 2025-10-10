import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockListPublicCollections } = vi.hoisted(() => {
  return { mockListPublicCollections: vi.fn() };
});

vi.mock("@/lib/services/collections/repository", () => ({
  listPublicCollections: mockListPublicCollections,
}));

vi.mock("@/lib/utils/cursor", () => ({
  encodeCursor: vi.fn(
    (data) => `encoded_${data.sort}_${data.value}_${data.id}`
  ),
  decodeCursor: vi.fn((cursor: string) => {
    const match = cursor.match(/^encoded_(-?[^_]+)_(.+)_([^_]+)$/);
    if (!match) return null;
    const [, sort, value, id] = match;
    if (sort === "name" || sort === "-name") {
      return { sort, value, id };
    }
    if (sort === "createdAt" || sort === "-createdAt") {
      return { sort, value, id };
    }
    return null;
  }),
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

describe("GET /api/collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated collections with default parameters", async () => {
    const mockCollections = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Collection",
        visibility: "public" as const,
        legendaryCount: 1,
        standardCount: 2,
        creator: fakeCreator,
        monsters: [],
        items: [],
        itemCount: 0,
        createdAt: new Date("2025-01-01"),
      },
    ];

    mockListPublicCollections.mockResolvedValue({
      collections: mockCollections,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/collections");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("collections");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");
    expect(resource.attributes.name).toBe("Test Collection");
  });

  it("should handle cursor pagination", async () => {
    const encodedCursor =
      "encoded_name_Test_550e8400-e29b-41d4-a716-446655440001";
    mockListPublicCollections.mockResolvedValue({
      collections: [],
      nextCursor: encodedCursor,
    });

    const request = new Request(
      "http://localhost:3000/api/collections?cursor=encoded_name_Collection_550e8400-e29b-41d4-a716-446655440000"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.links?.next).toContain(`cursor=${encodedCursor}`);
    expect(mockListPublicCollections).toHaveBeenCalledWith({
      cursor: "encoded_name_Collection_550e8400-e29b-41d4-a716-446655440000",
      limit: 100,
      sort: "name",
    });
  });

  it("should handle custom limit", async () => {
    mockListPublicCollections.mockResolvedValue({
      collections: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/collections?limit=50"
    );
    await GET(request);

    expect(mockListPublicCollections).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 50,
      sort: "name",
    });
  });

  it("should reject invalid limit", async () => {
    const request = new Request(
      "http://localhost:3000/api/collections?limit=0"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should reject limit over 100", async () => {
    const request = new Request(
      "http://localhost:3000/api/collections?limit=101"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should handle sort by name ascending", async () => {
    mockListPublicCollections.mockResolvedValue({
      collections: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/collections?sort=name"
    );
    await GET(request);

    expect(mockListPublicCollections).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
    });
  });

  it("should handle sort by name descending", async () => {
    mockListPublicCollections.mockResolvedValue({
      collections: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/collections?sort=-name"
    );
    await GET(request);

    expect(mockListPublicCollections).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-name",
    });
  });

  it("should handle sort by createdAt ascending", async () => {
    mockListPublicCollections.mockResolvedValue({
      collections: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/collections?sort=createdAt"
    );
    await GET(request);

    expect(mockListPublicCollections).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "createdAt",
    });
  });

  it("should handle sort by createdAt descending", async () => {
    mockListPublicCollections.mockResolvedValue({
      collections: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/collections?sort=-createdAt"
    );
    await GET(request);

    expect(mockListPublicCollections).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-createdAt",
    });
  });

  it("should reject invalid sort parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/collections?sort=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Invalid sort parameter");
  });

  it("should include relationships in response", async () => {
    const mockCollections = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "My Collection",
        visibility: "public" as const,
        legendaryCount: 0,
        standardCount: 3,
        creator: fakeCreator,
        monsters: [],
        items: [],
        itemCount: 0,
      },
    ];

    mockListPublicCollections.mockResolvedValue({
      collections: mockCollections,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/collections");
    const response = await GET(request);
    const data = await response.json();

    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("collections");
    expect(resource.relationships).toHaveProperty("creator");
    expect(resource.relationships.creator.data.type).toBe("users");
    expect(resource.relationships.creator.data.id).toBe("testuser");
  });
});
