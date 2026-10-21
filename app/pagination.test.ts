import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  items: vi.fn(),
  encounters: vi.fn(),
  collections: vi.fn(),
  myEncounters: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("@/lib/services/items/repository", () => ({
  searchPublicItems: mocks.items,
}));
vi.mock("@/lib/services/encounters/repository", () => ({
  searchPublicEncounters: mocks.encounters,
  searchEncountersForCreator: mocks.myEncounters,
}));
vi.mock("@/lib/services/collections/repository", () => ({
  searchPublicCollections: mocks.collections,
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));

import { publicCollectionsInfiniteQueryOptions } from "./collections/actions";
import { publicEncountersInfiniteQueryOptions } from "./encounters/actions";
import { publicItemsInfiniteQueryOptions } from "./items/actions";
import { myEncountersInfiniteQueryOptions } from "./my/encounters/hooks";

afterEach(() => vi.clearAllMocks());

function testPagination<Page extends { data: unknown[]; hasMore: boolean }>(
  name: string,
  search: Mock,
  options: {
    queryFn: (params: { pageParam: number }) => Promise<Page>;
    getNextPageParam: (
      lastPage: Page,
      allPages: Page[],
      lastPageParam: number
    ) => number | undefined;
  }
) {
  describe(name, () => {
    it.each([
      { count: 0, hasMore: false },
      { count: 2, hasMore: false },
      { count: 3, hasMore: false },
      { count: 4, hasMore: true },
    ])("detects continuation with $count rows for a limit of 3", async ({
      count,
      hasMore,
    }) => {
      mocks.auth.mockResolvedValue({ user: { id: "current-user" } });
      const rows = Array.from({ length: count }, (_, index) => ({
        id: `entity-${index}`,
      }));
      search.mockResolvedValue(rows);

      const result = await options.queryFn({ pageParam: 2 });

      expect(search).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 4,
          offset: 6,
          searchTerm: "test",
          sortBy: "name",
          sortDirection: "desc",
        })
      );
      expect(result).toEqual({ data: rows.slice(0, 3), hasMore });
      expect(options.getNextPageParam(result, [result], 2)).toBe(
        hasMore ? 3 : undefined
      );
      if (name === "my encounters") {
        expect(search).toHaveBeenCalledWith(
          expect.objectContaining({ creatorId: "current-user" })
        );
      }
    });
  });
}

const params = { limit: 3, search: "test", sort: "-name" };
testPagination("items", mocks.items, publicItemsInfiniteQueryOptions(params));
testPagination(
  "encounters",
  mocks.encounters,
  publicEncountersInfiniteQueryOptions(params)
);
testPagination(
  "collections",
  mocks.collections,
  publicCollectionsInfiniteQueryOptions(params)
);
testPagination(
  "my encounters",
  mocks.myEncounters,
  myEncountersInfiniteQueryOptions(params)
);
