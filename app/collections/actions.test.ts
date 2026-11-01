import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { publicCollectionsInfiniteQueryOptions } from "./actions";

afterEach(() => vi.unstubAllGlobals());

it("uses a stable cancellable GET and revives every dated collection membership", async () => {
  const date = "2026-01-01T00:00:00.000Z";
  const member = { id: "member", createdAt: date, updatedAt: date };
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            id: "a",
            createdAt: date,
            creator: { username: "owner" },
            monsters: [member],
            items: [member],
            ancestries: [member],
            backgrounds: [member],
            subclasses: [member],
            spellSchools: [member],
            classes: [member],
            companions: [{ id: "companion" }],
          },
        ],
        hasMore: true,
      })
    )
  );
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const options = publicCollectionsInfiniteQueryOptions({
    search: "Moon & sun",
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
  expect(init.credentials).toBe("same-origin");
  expect(init.signal).toBe(controller.signal);
  expect(new URL(request.url).pathname).toBe("/_actions/publicCollections");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    pageParam: "2",
    search: "Moon & sun",
    sort: "-name",
    limit: "3",
  });
  const collection = result.data[0];
  expect(collection.createdAt).toEqual(new Date(date));
  for (const members of [
    collection.monsters,
    collection.items,
    collection.ancestries,
    collection.backgrounds,
    collection.subclasses,
    collection.spellSchools,
    collection.classes,
  ])
    expect(members[0].createdAt).toEqual(new Date(date));
  expect(collection.items[0].updatedAt).toEqual(new Date(date));
  expect(collection.ancestries[0].updatedAt).toEqual(new Date(date));
  expect(collection.backgrounds[0].updatedAt).toEqual(new Date(date));
  expect(collection.creator.username).toBe("owner");
  expect(options.getNextPageParam(result, [result], 2)).toBe(3);
  expect(
    options.getNextPageParam({ ...result, hasMore: false }, [result], 2)
  ).toBeUndefined();
});

it("retains query keys, previous data and null-search omission", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ data: [], hasMore: false }))
    );
  vi.stubGlobal("fetch", fetch);
  const options = publicCollectionsInfiniteQueryOptions();
  await options.queryFn({ pageParam: 0 });
  expect(
    new URL(fetch.mock.calls[0][0], "https://nimble.nexus").searchParams.has(
      "search"
    )
  ).toBe(false);
  expect(options.queryKey).toEqual([
    "collections",
    { search: null, sort: "-createdAt", limit: 12 },
  ]);
  expect(options.queryKey).not.toEqual(
    publicCollectionsInfiniteQueryOptions({ search: "other" }).queryKey
  );
  expect(options.queryKey).not.toEqual(
    publicCollectionsInfiniteQueryOptions({ sort: "name" }).queryKey
  );
  expect(options.placeholderData({ data: [], hasMore: true })).toEqual({
    data: [],
    hasMore: true,
  });
});

it("retains loaded data after failed refetch and recovers with typed errors", async () => {
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
  const options = publicCollectionsInfiniteQueryOptions();
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
    expect((await client.fetchInfiniteQuery(options)).pages[0].hasMore).toBe(
      false
    );
  } finally {
    client.clear();
  }
});
