import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { publicItemsInfiniteQueryOptions } from "./actions";

afterEach(() => vi.unstubAllGlobals());

it("uses a cancellable stable GET, encodes filters and revives item/source/award dates", async () => {
  const date = "2026-01-01T00:00:00.000Z";
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            id: "a",
            createdAt: date,
            updatedAt: date,
            creator: { username: "owner" },
            source: { createdAt: date, updatedAt: date },
            awards: [{ createdAt: date, updatedAt: date }],
          },
        ],
        hasMore: true,
      })
    )
  );
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const options = publicItemsInfiniteQueryOptions({
    search: "Moon & sun",
    source: "C & H",
    creatorId: "owner",
    rarity: "very_rare",
    sort: "-name",
    limit: 3,
  });
  const result = await options.queryFn({
    pageParam: 2,
    signal: controller.signal,
  });
  const [url, init] = fetch.mock.calls[0];
  const request = new Request(new URL(url, "https://nimble.nexus"), init);
  expect(request.method).toBe("GET");
  expect(request.body).toBeNull();
  expect(request.headers.has("next-action")).toBe(false);
  expect(request.headers.has("content-type")).toBe(false);
  expect(init.signal).toBe(controller.signal);
  expect(init.credentials).toBe("same-origin");
  expect(new URL(request.url).pathname).toBe("/_actions/publicItems");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    pageParam: "2",
    search: "Moon & sun",
    source: "C & H",
    creatorId: "owner",
    rarity: "very_rare",
    sort: "-name",
    limit: "3",
  });
  expect(result.data[0].createdAt).toEqual(new Date(date));
  expect(result.data[0].source?.updatedAt).toEqual(new Date(date));
  expect(result.data[0].awards?.[0].createdAt).toEqual(new Date(date));
  expect(result.data[0].creator.username).toBe("owner");
  expect(options.getNextPageParam(result, [result], 2)).toBe(3);
  expect(
    options.getNextPageParam({ ...result, hasMore: false }, [result], 2)
  ).toBeUndefined();
});

it("omits null search and retains independent query keys", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ data: [], hasMore: false }))
    );
  vi.stubGlobal("fetch", fetch);
  const options = publicItemsInfiniteQueryOptions();
  await options.queryFn({ pageParam: 0 });
  expect(
    new URL(fetch.mock.calls[0][0], "https://nimble.nexus").searchParams.has(
      "search"
    )
  ).toBe(false);
  expect(options.queryKey).not.toEqual(
    publicItemsInfiniteQueryOptions({ rarity: "rare" }).queryKey
  );
  expect(options.queryKey).not.toEqual(
    publicItemsInfiniteQueryOptions({ creatorId: "other" }).queryKey
  );
  expect(options.placeholderData({ data: [], hasMore: true })).toEqual({
    data: [],
    hasMore: true,
  });
});

it("retains a loaded page across failed refetch and recovers with typed errors", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [], hasMore: true }))
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 })
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [], hasMore: false }))
    );
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const options = publicItemsInfiniteQueryOptions();
  try {
    const first = await client.fetchInfiniteQuery(options);
    await client.invalidateQueries({ queryKey: options.queryKey });
    await expect(client.fetchInfiniteQuery(options)).rejects.toMatchObject({
      status: 503,
      code: "HTTP_503",
    });
    expect(client.getQueryData(options.queryKey)).toEqual(first);
    expect(client.getQueryState(options.queryKey)?.error).toBeInstanceOf(
      RouteError
    );
    const recovered = await client.fetchInfiniteQuery(options);
    expect(recovered.pages[0].hasMore).toBe(false);
  } finally {
    client.clear();
  }
});
