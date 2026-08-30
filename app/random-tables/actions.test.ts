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
    mockCall.mockResolvedValue({
      data: [
        {
          id: "table-1",
          name: "Weather",
          visibility: "public",
          creator: { id: "user-1" },
          subtables: [],
          createdAt: "2026-08-30T12:00:00.000Z",
        },
      ],
    });
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
  });
});
