import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockGetPublicFamily } = vi.hoisted(() => {
  return { mockGetPublicFamily: vi.fn() };
});

vi.mock("@/lib/services/families", () => ({
  familiesService: {
    getPublicFamily: mockGetPublicFamily,
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
  uuidToIdentifier: vi.fn(() => {
    return "0psvtrh43w8xm9dfbf5b6nkcq1";
  }),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  avatar: "avatar.jpg",
  username: "testuser",
  displayName: "Test User",
  imageUrl: "https://example.com/avatar.jpg",
};

describe("GET /api/families/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return a family by slug", async () => {
    const mockFamily = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Humanoids",
      description: "Bipedal creatures with human-like forms",
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
    };

    mockGetPublicFamily.mockResolvedValue(mockFamily);

    const request = new Request(
      "http://localhost:3000/api/families/humanoids-abc"
    );
    const response = await GET(request, createMockParams("humanoids-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );

    expect(data).toHaveProperty("data");
    const resource = data.data;
    expect(resource.type).toBe("families");
    expect(resource).toHaveProperty("id");
    expect(resource).toHaveProperty("attributes");
    expect(resource.attributes.name).toBe("Humanoids");
    expect(resource.attributes.description).toBe(
      "Bipedal creatures with human-like forms"
    );
    expect(resource.attributes.abilities).toHaveLength(1);
    expect(resource.attributes.abilities[0].name).toBe("Pack Tactics");
  });

  it("should return 404 for non-existent family", async () => {
    mockGetPublicFamily.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/families/nonexistent"
    );
    const response = await GET(request, createMockParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Family not found");
  });

  it("should return 404 for invalid slug", async () => {
    const request = new Request(
      "http://localhost:3000/api/families/invalid-slug"
    );
    const response = await GET(request, createMockParams("invalid-slug"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("Family not found");
  });

  it("should include self link in response", async () => {
    const mockFamily = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Undead",
      description: "Creatures that have died and been reanimated",
      abilities: [],
      visibility: "public",
      creatorId: fakeCreator.id,
      creator: fakeCreator,
    };

    mockGetPublicFamily.mockResolvedValue(mockFamily);

    const request = new Request(
      "http://localhost:3000/api/families/undead-abc"
    );
    const response = await GET(request, createMockParams("undead-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.links).toHaveProperty("self");
    expect(data.data.links.self).toContain("/api/families/");
  });

  it("should handle family with no abilities", async () => {
    const mockFamily = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Constructs",
      description: null,
      abilities: [],
      visibility: "public",
      creatorId: fakeCreator.id,
      creator: fakeCreator,
    };

    mockGetPublicFamily.mockResolvedValue(mockFamily);

    const request = new Request(
      "http://localhost:3000/api/families/constructs-abc"
    );
    const response = await GET(request, createMockParams("constructs-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.attributes.name).toBe("Constructs");
    expect(data.data.attributes.abilities).toEqual([]);
  });
});
