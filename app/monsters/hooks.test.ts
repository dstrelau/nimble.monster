import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { publicMonstersInfiniteQueryOptions } from "./hooks";

afterEach(() => vi.unstubAllGlobals());

it("uses a cancellable stable bodyless GET with all filters and revives domain dates", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            id: "a",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-02-02T00:00:00.000Z",
            source: {
              createdAt: "2024-03-03T00:00:00.000Z",
              updatedAt: "2025-04-04T00:00:00.000Z",
            },
            awards: [
              {
                createdAt: "2025-05-05T00:00:00.000Z",
                updatedAt: "2026-06-06T00:00:00.000Z",
              },
            ],
            members: [{ name: "Left", hp: 17 }],
            families: [{ name: "Pack" }],
            creator: { username: "owner" },
          },
        ],
        nextCursor: "next",
      })
    )
  );
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const options = publicMonstersInfiniteQueryOptions({
    search: "Wolf & moon",
    sort: "level",
    source: "C & H",
    creatorId: "creator",
    role: "melee",
    level: -2,
    type: "teams",
    limit: 2,
  });
  const result = await options.queryFn({
    pageParam: "cursor/+",
    signal: controller.signal,
  });
  const [url, init] = fetch.mock.calls[0];
  const request = new Request(new URL(url, "https://nimble.nexus"), init);
  expect(request.method).toBe("GET");
  expect(request.headers.has("next-action")).toBe(false);
  expect(request.headers.has("content-type")).toBe(false);
  expect(request.body).toBeNull();
  expect(init.signal).toBe(controller.signal);
  expect(init.credentials).toBe("same-origin");
  expect(new URL(request.url).pathname).toBe("/_actions/publicMonsters");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    cursor: "cursor/+",
    search: "Wolf & moon",
    sort: "level",
    source: "C & H",
    creatorId: "creator",
    role: "melee",
    level: "-2",
    type: "teams",
    limit: "2",
  });
  expect(result.data[0]).toMatchObject({
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    source: {
      createdAt: new Date("2024-03-03T00:00:00.000Z"),
      updatedAt: new Date("2025-04-04T00:00:00.000Z"),
    },
    awards: [
      {
        createdAt: new Date("2025-05-05T00:00:00.000Z"),
        updatedAt: new Date("2026-06-06T00:00:00.000Z"),
      },
    ],
    members: [{ name: "Left", hp: 17 }],
    families: [{ name: "Pack" }],
    creator: { username: "owner" },
  });
  expect(options.getNextPageParam(result)).toBe("next");
});

it("isolates filters/creators, retains data on typed failure and recovers", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetch = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify({ data: [], nextCursor: null }))
    );
  vi.stubGlobal("fetch", fetch);
  const options = publicMonstersInfiniteQueryOptions({ creatorId: "one" });
  try {
    await client.fetchInfiniteQuery(options);
    for (const params of [
      { creatorId: "two" },
      { creatorId: "one", level: -2 },
      { creatorId: "one", source: "C" },
    ]) {
      expect(
        client.getQueryData(publicMonstersInfiniteQueryOptions(params).queryKey)
      ).toBeUndefined();
    }
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      })
    );
    await expect(client.fetchInfiniteQuery(options)).rejects.toEqual(
      new RouteError("Internal Server Error", 500, "HTTP_500")
    );
    expect(client.getQueryData(options.queryKey)).toMatchObject({
      pages: [{ data: [], nextCursor: null }],
    });
    await expect(client.fetchInfiniteQuery(options)).resolves.toMatchObject({
      pages: [{ data: [], nextCursor: null }],
    });
  } finally {
    client.clear();
  }
});
