import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockIsFeatureFlagEnabled, mockSearchPublicRandomTables } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockIsFeatureFlagEnabled: vi.fn(),
    mockSearchPublicRandomTables: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/featureFlags", () => ({
  isFeatureFlagEnabled: mockIsFeatureFlagEnabled,
}));
vi.mock("@/lib/services/random-tables/repository", () => ({
  searchPublicRandomTables: mockSearchPublicRandomTables,
}));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

import { POST } from "./route";

const SESSION = { user: { id: "user-1" } };

function request(body: unknown) {
  return new Request("http://localhost/_actions/searchRandomTables", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION);
  mockIsFeatureFlagEnabled.mockResolvedValue(true);
});

describe("POST /_actions/searchRandomTables", () => {
  it("searches public tables and serializes dates", async () => {
    mockSearchPublicRandomTables.mockResolvedValue([
      {
        id: "table-1",
        name: "Weather",
        visibility: "public",
        creator: { id: "user-1" },
        subtables: [],
        createdAt: new Date("2026-08-30T12:00:00.000Z"),
      },
    ]);

    const response = await POST(
      request({ sort: "-name", search: "weather", limit: 12, page: 2 })
    );

    expect(response.status).toBe(200);
    expect(mockSearchPublicRandomTables).toHaveBeenCalledWith({
      searchTerm: "weather",
      sortBy: "name",
      sortDirection: "desc",
      limit: 12,
      offset: 24,
    });
    expect(await response.json()).toEqual({
      data: [
        expect.objectContaining({
          id: "table-1",
          createdAt: "2026-08-30T12:00:00.000Z",
        }),
      ],
    });
  });

  it("does not search when the feature is disabled", async () => {
    mockIsFeatureFlagEnabled.mockResolvedValue(false);

    const response = await POST(
      request({ sort: "name", search: null, limit: 12, page: 0 })
    );

    expect(response.status).toBe(404);
    expect(mockSearchPublicRandomTables).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination", async () => {
    const response = await POST(
      request({ sort: "name", search: null, limit: 0, page: -1 })
    );

    expect(response.status).toBe(400);
    expect(mockSearchPublicRandomTables).not.toHaveBeenCalled();
  });
});
