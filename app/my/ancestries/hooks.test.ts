import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { myAncestriesInfiniteQueryOptions } from "./hooks";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("My Library ancestry queries", () => {
  it.each([
    "owner-2",
    undefined,
  ])("clears private results when the owner changes to %s", async (nextOwner) => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "owner-1-private-ancestry",
                visibility: "private",
                createdAt: "2026-09-01T12:00:00.000Z",
                updatedAt: "2026-09-20T18:30:00.000Z",
              },
            ],
          })
        )
      )
      .mockImplementation(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetch);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const initialProps: { ownerId: string | undefined } = {
      ownerId: "owner-1",
    };
    const { result, rerender, unmount } = renderHook(
      ({ ownerId }: { ownerId: string | undefined }) =>
        useInfiniteQuery(myAncestriesInfiniteQueryOptions({ ownerId })),
      {
        initialProps,
        wrapper: ({ children }: { children: ReactNode }) =>
          createElement(QueryClientProvider, { client }, children),
      }
    );
    await waitFor(() =>
      expect(result.current.data?.pages[0].data[0].id).toBe(
        "owner-1-private-ancestry"
      )
    );

    rerender({ ownerId: nextOwner });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(nextOwner !== undefined);
    expect(fetch).toHaveBeenCalledTimes(nextOwner ? 2 : 1);
    unmount();
    client.clear();
  });

  it("uses a private GET contract, preserves cursors and revives all serialized dates", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "private-ancestry",
              visibility: "private",
              createdAt: "2026-09-01T12:00:00.000Z",
              updatedAt: "2026-09-20T18:30:00.000Z",
              source: {
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2025-02-02T00:00:00.000Z",
              },
              awards: [
                {
                  createdAt: "2025-03-03T00:00:00.000Z",
                  updatedAt: "2026-04-04T00:00:00.000Z",
                },
              ],
            },
          ],
          nextCursor: "next-page",
        })
      )
    );
    vi.stubGlobal("fetch", fetch);
    const options = myAncestriesInfiniteQueryOptions({
      ownerId: "owner-1",
      search: "moon & sun",
      sort: "name",
      limit: 2,
    });
    const result = await options.queryFn({ pageParam: "cursor-value" });
    expect(fetch).toHaveBeenCalledWith(
      "/_actions/myAncestries?cursor=cursor-value&search=moon+%26+sun&sort=name&limit=2",
      { method: "GET", credentials: "same-origin" }
    );
    expect(result.data[0]).toMatchObject({
      visibility: "private",
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
      updatedAt: new Date("2026-09-20T18:30:00.000Z"),
      source: {
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-02-02T00:00:00.000Z"),
      },
      awards: [
        {
          createdAt: new Date("2025-03-03T00:00:00.000Z"),
          updatedAt: new Date("2026-04-04T00:00:00.000Z"),
        },
      ],
    });
    expect(options.getNextPageParam(result)).toBe("next-page");
    expect(options.queryKey).not.toEqual(
      myAncestriesInfiniteQueryOptions({
        ownerId: "owner-2",
        search: "moon & sun",
        sort: "name",
        limit: 2,
      }).queryKey
    );
  });
});
