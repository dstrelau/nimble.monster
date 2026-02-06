import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockGetFamily } = vi.hoisted(() => {
  return { mockGetFamily: vi.fn() };
});

vi.mock("@/lib/db/family", () => ({
  getFamily: mockGetFamily,
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn((slug: string) => {
    if (slug === "invalid-slug") return null;
    return "660e8400-e29b-41d4-a716-446655440001";
  }),
  uuidToIdentifier: vi.fn(() => "1abc2def3ghi4jkl5mno6pqrs7"),
}));

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
  imageUrl: "https://example.com/avatar.png",
};

describe("GET /api/families/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return a family by slug", async () => {
    mockGetFamily.mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655440001",
      name: "Goblinoids",
      description: "A family of goblin-like creatures",
      abilities: [],
      monsterCount: 3,
      creatorId: "user123",
      creator: fakeCreator,
    });

    const request = new Request(
      "http://localhost:3000/api/families/goblinoids-abc"
    );
    const response = await GET(request, createMockParams("goblinoids-abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );

    const resource = data.data;
    expect(resource.type).toBe("families");
    expect(resource).toHaveProperty("id");
    expect(resource.attributes.name).toBe("Goblinoids");
    expect(resource.attributes.description).toBe(
      "A family of goblin-like creatures"
    );
    expect(resource.attributes.monsterCount).toBe(3);
    expect(resource.relationships.creator.data.type).toBe("users");
    expect(resource.relationships.creator.data.id).toBe("testuser");
    expect(resource.links.self).toContain("/api/families/");
  });

  it("should return 404 for non-existent family", async () => {
    mockGetFamily.mockResolvedValue(null);

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
});
