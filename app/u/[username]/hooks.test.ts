import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { userProfileHazardsInfiniteQueryOptions } from "./hooks";

afterEach(() => vi.unstubAllGlobals());

it("uses a cancellable stable bodyless GET and revives hazard/source/award dates", async () => {
  const date = "2026-01-02T03:04:05.000Z";
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            id: "hazard",
            hazard: true,
            createdAt: date,
            updatedAt: date,
            source: { abbreviation: "C", createdAt: date, updatedAt: date },
            awards: [{ slug: "winner", createdAt: date, updatedAt: date }],
            abilities: [{ name: "Hidden" }],
            actions: [{ name: "Fall" }],
            creator: { username: "owner" },
          },
        ],
        nextCursor: "next",
      })
    )
  );
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const options = userProfileHazardsInfiniteQueryOptions("owner", {
    search: "Rock & ice",
    sort: "level",
    source: "C & H",
    level: -2,
    limit: 2,
  });
  const result = await options.queryFn({
    pageParam: "cursor/+",
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
  expect(new URL(request.url).pathname).toBe("/_actions/publicHazards");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    creatorId: "owner",
    search: "Rock & ice",
    sort: "level",
    source: "C & H",
    level: "-2",
    limit: "2",
    cursor: "cursor/+",
  });
  expect(result.data[0]).toMatchObject({
    id: "hazard",
    hazard: true,
    createdAt: new Date(date),
    updatedAt: new Date(date),
    source: {
      abbreviation: "C",
      createdAt: new Date(date),
      updatedAt: new Date(date),
    },
    awards: [
      { slug: "winner", createdAt: new Date(date), updatedAt: new Date(date) },
    ],
    abilities: [{ name: "Hidden" }],
    actions: [{ name: "Fall" }],
    creator: { username: "owner" },
  });
  expect(options.getNextPageParam(result)).toBe("next");
});

it("isolates creator/filter caches, retains failed-refetch data and recovers", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetch = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify({ data: [], nextCursor: null }))
    );
  vi.stubGlobal("fetch", fetch);
  const options = userProfileHazardsInfiniteQueryOptions("one");
  try {
    await client.fetchInfiniteQuery(options);
    for (const query of [
      userProfileHazardsInfiniteQueryOptions("two"),
      userProfileHazardsInfiniteQueryOptions("one", { level: -2 }),
      userProfileHazardsInfiniteQueryOptions("one", { source: "C" }),
    ]) {
      expect(client.getQueryData(query.queryKey)).toBeUndefined();
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
