import { afterEach, describe, expect, it, vi } from "vitest";

const mockCall = vi.hoisted(() => vi.fn());

vi.mock("@/lib/contract", () => ({
  call: mockCall,
  defineRoute: (contract: unknown) => contract,
}));

import { publicRandomTablesInfiniteQueryOptions } from "./actions";

afterEach(() => {
  vi.clearAllMocks();
});

describe("publicRandomTablesInfiniteQueryOptions", () => {
  it("uses the JSON search route and revives dates", async () => {
    const response = Response.json({
      data: [
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
      ],
    });
    mockCall.mockResolvedValue(await response.json());
    const options = publicRandomTablesInfiniteQueryOptions({
      search: "weather",
      sort: "-name",
      limit: 6,
    });

    const result = await options.queryFn({ pageParam: 2 });

    expect(mockCall).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: expect.any(Function),
      }),
      { search: "weather", sort: "-name", limit: 6, page: 2 }
    );
    expect(result.data[0].createdAt).toEqual(
      new Date("2026-08-30T12:00:00.000Z")
    );
    expect(result.data[0].source?.createdAt.getTime()).toBe(
      Date.UTC(2026, 7, 1, 9, 30)
    );
    expect(result.data[0].source?.updatedAt.getTime()).toBe(
      Date.UTC(2026, 8, 2, 15, 45)
    );
    expect(result.data[0].source).toMatchObject({
      id: "source-1",
      name: "Core Rules 3.0",
      abbreviation: "Core3",
      license: "Nimble 3rd Party Creator License v2.0",
      link: "https://nimblerpg.com/",
    });
    expect(result.data[1].createdAt).toBeUndefined();
    expect(result.data[1].source).toBeUndefined();
  });
});
