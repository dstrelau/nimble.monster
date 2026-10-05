import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSearchPublicRandomTables } = vi.hoisted(() => ({
  mockSearchPublicRandomTables: vi.fn(),
}));

vi.mock("@/lib/services/random-tables/repository", () => ({
  searchPublicRandomTables: mockSearchPublicRandomTables,
}));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

import { POST } from "./route";

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
});

describe("POST /_actions/searchRandomTables", () => {
  it("searches public tables without authentication and serializes dates", async () => {
    mockSearchPublicRandomTables.mockResolvedValue([
      {
        id: "table-1",
        name: "Weather",
        visibility: "public",
        creator: { id: "user-1" },
        subtables: [],
        createdAt: new Date("2026-08-30T12:00:00.000Z"),
        source: {
          id: "source-1",
          name: "Core Rules 3.0",
          abbreviation: "Core3",
          license: "Nimble 3rd Party Creator License v2.0",
          link: "https://nimblerpg.com/",
          createdAt: new Date("2026-08-01T09:30:00.000Z"),
          updatedAt: new Date("2026-09-02T15:45:00.000Z"),
        },
      },
      {
        id: "unsourced-table",
        name: "Travel",
        visibility: "public",
        creator: { id: "user-1" },
        subtables: [],
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
          source: {
            id: "source-1",
            name: "Core Rules 3.0",
            abbreviation: "Core3",
            license: "Nimble 3rd Party Creator License v2.0",
            link: "https://nimblerpg.com/",
            createdAt: "2026-08-01T09:30:00.000Z",
            updatedAt: "2026-09-02T15:45:00.000Z",
          },
        }),
        {
          id: "unsourced-table",
          name: "Travel",
          visibility: "public",
          creator: { id: "user-1" },
          subtables: [],
        },
      ],
    });
  });

  it("still rejects cross-origin requests", async () => {
    const crossOriginRequest = request({
      sort: "name",
      search: null,
      limit: 12,
      page: 0,
    });
    crossOriginRequest.headers.set("Origin", "https://other.example");

    const response = await POST(crossOriginRequest);

    expect(response.status).toBe(403);
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
