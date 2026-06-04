import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
    })),
  },
}));

const { mockGetUserByUsername } = vi.hoisted(() => {
  return { mockGetUserByUsername: vi.fn() };
});

vi.mock("@/lib/db/user", () => ({
  getUserByUsername: mockGetUserByUsername,
}));

vi.mock("@/lib/telemetry", () => ({
  telemetry: vi.fn((handler) => handler),
}));

const fakeUser = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
  imageUrl: "https://example.com/avatar.png",
};

describe("GET /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve a username to a single user via ?username", async () => {
    mockGetUserByUsername.mockResolvedValue(fakeUser);

    const request = new Request(
      "http://localhost:3000/api/users?username=testuser"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.api+json"
    );
    expect(mockGetUserByUsername).toHaveBeenCalledWith("testuser");
    expect(data.data).toHaveLength(1);

    const resource = data.data[0];
    expect(resource.type).toBe("users");
    expect(resource.id).toBe("0j6hb7g4hm28t14d0j6hb7h45b");
    expect(resource.attributes.username).toBe("testuser");
    expect(resource.attributes.displayName).toBe("Test User");
    expect(resource.attributes.imageUrl).toBe("https://example.com/avatar.png");
    expect(resource.attributes).not.toHaveProperty("discordId");
    expect(resource.attributes).not.toHaveProperty("email");
    expect(resource.links.self).toBe("/api/users/0j6hb7g4hm28t14d0j6hb7h45b");
    expect(data).not.toHaveProperty("links");
  });

  it("should return an empty collection when the username does not exist", async () => {
    mockGetUserByUsername.mockResolvedValue(null);

    const request = new Request(
      "http://localhost:3000/api/users?username=nobody"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it("should require the username parameter", async () => {
    const request = new Request("http://localhost:3000/api/users");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].status).toBe("400");
    expect(mockGetUserByUsername).not.toHaveBeenCalled();
  });
});
