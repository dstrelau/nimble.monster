import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockListPublicEncounters } = vi.hoisted(() => {
  return { mockListPublicEncounters: vi.fn() };
});

vi.mock("@/lib/services/encounters/repository", () => ({
  listPublicEncounters: mockListPublicEncounters,
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

describe("GET /api/encounters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated encounters with default parameters", async () => {
    const mockEncounters = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Encounter",
        visibility: "public" as const,
        heroCount: 4,
        heroLevel: 1,
        creator: fakeCreator,
        monsters: [],
        createdAt: new Date("2025-01-01"),
      },
    ];

    mockListPublicEncounters.mockResolvedValue({
      encounters: mockEncounters,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/encounters");
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
    expect(resource.type).toBe("encounters");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");
    expect(resource.attributes.name).toBe("Test Encounter");
    expect(resource.attributes.heroCount).toBe(4);
  });

  it("should handle cursor pagination", async () => {
    const encodedCursor =
      "encoded_name_Test_550e8400-e29b-41d4-a716-446655440001";
    mockListPublicEncounters.mockResolvedValue({
      encounters: [],
      nextCursor: encodedCursor,
    });

    const request = new Request(
      "http://localhost:3000/api/encounters?cursor=encoded_name_Encounter_550e8400-e29b-41d4-a716-446655440000"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.links?.next).toContain(`cursor=${encodedCursor}`);
    expect(mockListPublicEncounters).toHaveBeenCalledWith({
      cursor: "encoded_name_Encounter_550e8400-e29b-41d4-a716-446655440000",
      limit: 100,
      sort: "name",
    });
  });

  it("should handle custom limit", async () => {
    mockListPublicEncounters.mockResolvedValue({
      encounters: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/encounters?limit=50"
    );
    await GET(request);

    expect(mockListPublicEncounters).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 50,
      sort: "name",
    });
  });

  it("should reject invalid limit", async () => {
    const request = new Request("http://localhost:3000/api/encounters?limit=0");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should reject limit over 100", async () => {
    const request = new Request(
      "http://localhost:3000/api/encounters?limit=101"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should reject invalid sort parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/encounters?sort=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Invalid sort parameter");
  });

  it("should include relationships in response", async () => {
    const mockEncounters = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "My Encounter",
        visibility: "public" as const,
        heroCount: 4,
        heroLevel: 1,
        creator: fakeCreator,
        monsters: [],
      },
    ];

    mockListPublicEncounters.mockResolvedValue({
      encounters: mockEncounters,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/encounters");
    const response = await GET(request);
    const data = await response.json();

    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("encounters");
    expect(resource.relationships).toHaveProperty("creator");
    expect(resource.relationships.creator.data.type).toBe("users");
    expect(resource.relationships.creator.data.id).toBe(
      "0j6hb7g4hm28t14d0j6hb7h45b"
    );
  });

  it("should include the creator when include=creator", async () => {
    const mockEncounters = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "My Encounter",
        visibility: "public" as const,
        heroCount: 4,
        heroLevel: 1,
        creator: fakeCreator,
        monsters: [],
      },
    ];

    mockListPublicEncounters.mockResolvedValue({
      encounters: mockEncounters,
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/encounters?include=creator"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.included).toHaveLength(1);
    expect(data.included[0].type).toBe("users");
    expect(data.included[0].id).toBe(
      data.data[0].relationships.creator.data.id
    );
    expect(data.included[0].attributes).not.toHaveProperty("discordId");
  });

  it("should reject an invalid include parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/encounters?include=bogus"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors[0].title).toContain("Invalid include parameter");
  });
});
