import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockGetUserById } = vi.hoisted(() => {
  return { mockGetUserById: vi.fn() };
});

vi.mock("@/lib/db/user", () => ({
  getUserById: mockGetUserById,
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

vi.mock("@/lib/utils/slug", () => ({
  deslugify: vi.fn((slug: string) => {
    if (slug === "invalid-slug") return null;
    return "12345678-1234-1234-1234-1234567890ab";
  }),
  uuidToIdentifier: vi.fn(() => "0j6hb7g4hm28t14d0j6hb7h45b"),
}));

const fakeUser = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
  imageUrl: "https://example.com/avatar.png",
};

describe("GET /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("should return a user by identifier with only public attributes", async () => {
    mockGetUserById.mockResolvedValue(fakeUser);

    const request = new Request(
      "http://localhost:3000/api/users/0j6hb7g4hm28t14d0j6hb7h45b"
    );
    const response = await GET(
      request,
      createMockParams("0j6hb7g4hm28t14d0j6hb7h45b")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );

    const resource = data.data;
    expect(resource.type).toBe("users");
    expect(resource.id).toBe("0j6hb7g4hm28t14d0j6hb7h45b");
    expect(resource.attributes.username).toBe("testuser");
    expect(resource.attributes.displayName).toBe("Test User");
    expect(resource.attributes.imageUrl).toBe("https://example.com/avatar.png");
    expect(resource.attributes).not.toHaveProperty("discordId");
    expect(resource.attributes).not.toHaveProperty("email");
    expect(resource.links.self).toBe("/api/users/0j6hb7g4hm28t14d0j6hb7h45b");
    expect(mockGetUserById).toHaveBeenCalledWith(
      "12345678-1234-1234-1234-1234567890ab"
    );
  });

  it("should return 404 for non-existent user", async () => {
    mockGetUserById.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/users/0j6hb7g4hm28t14d0j6hb7h45b"
    );
    const response = await GET(
      request,
      createMockParams("0j6hb7g4hm28t14d0j6hb7h45b")
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("404");
    expect(data.errors[0].title).toBe("User not found");
  });

  it("should return 404 for invalid identifier", async () => {
    const request = new Request("http://localhost:3000/api/users/invalid-slug");
    const response = await GET(request, createMockParams("invalid-slug"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors[0].title).toBe("User not found");
  });
});
