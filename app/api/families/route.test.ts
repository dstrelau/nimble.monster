import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockPaginateFamilies } = vi.hoisted(() => {
  return { mockPaginateFamilies: vi.fn() };
});

vi.mock("@/lib/services/families/service", async () => {
  return {
    familiesService: {
      paginatePublicFamilies: mockPaginateFamilies,
    },
  };
});

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
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
  imageUrl: "https://example.com/avatar.jpg",
};

describe("GET /api/families", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated families with default parameters", async () => {
    const mockFamilies = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Humanoids",
        description: "Bipedal creatures",
        abilities: [
          {
            id: "1",
            name: "Pack Tactics",
            description: "Advantage when allies near",
          },
        ],
        visibility: "public",
        creatorId: fakeCreator.id,
        creator: fakeCreator,
      },
    ];

    mockPaginateFamilies.mockResolvedValue({
      data: mockFamilies,
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/families");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(
      "application/vnd.api+json"
    );
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("families");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");
    expect(resource.attributes.name).toBe("Humanoids");
    expect(resource.attributes.description).toBe("Bipedal creatures");
    expect(resource.attributes.abilities).toHaveLength(1);
  });

  it("should handle cursor pagination", async () => {
    const encodedCursor =
      "encoded_name_Undead_550e8400-e29b-41d4-a716-446655440001";
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: encodedCursor,
    });

    const request = new Request(
      "http://localhost:3000/api/families?cursor=encoded_name_Humanoids_550e8400-e29b-41d4-a716-446655440000"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.links?.next).toContain(`cursor=${encodedCursor}`);
    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: "encoded_name_Humanoids_550e8400-e29b-41d4-a716-446655440000",
      limit: 100,
      sort: "name",
      search: undefined,
    });
  });

  it("should handle custom limit", async () => {
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/families?limit=50");
    await GET(request);

    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 50,
      sort: "name",
      search: undefined,
    });
  });

  it("should reject invalid limit", async () => {
    const request = new Request("http://localhost:3000/api/families?limit=0");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should reject limit over 100", async () => {
    const request = new Request("http://localhost:3000/api/families?limit=101");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Limit must be between 1 and 100");
  });

  it("should handle sort by name ascending", async () => {
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request("http://localhost:3000/api/families?sort=name");
    await GET(request);

    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
      search: undefined,
    });
  });

  it("should handle sort by name descending", async () => {
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/families?sort=-name"
    );
    await GET(request);

    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-name",
      search: undefined,
    });
  });

  it("should handle sort by createdAt ascending", async () => {
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/families?sort=createdAt"
    );
    await GET(request);

    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "createdAt",
      search: undefined,
    });
  });

  it("should handle sort by createdAt descending", async () => {
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/families?sort=-createdAt"
    );
    await GET(request);

    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "-createdAt",
      search: undefined,
    });
  });

  it("should reject invalid sort parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/families?sort=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(data.errors[0].title).toBe("Invalid sort parameter");
  });

  it("should handle search parameter", async () => {
    mockPaginateFamilies.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    const request = new Request(
      "http://localhost:3000/api/families?search=humanoid"
    );
    await GET(request);

    expect(mockPaginateFamilies).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 100,
      sort: "name",
      search: "humanoid",
    });
  });
});
