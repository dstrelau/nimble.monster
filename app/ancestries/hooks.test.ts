import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { publicAncestriesInfiniteQueryOptions } from "./hooks";

afterEach(() => vi.unstubAllGlobals());

it("uses a cancellable stable bodyless GET, preserves filters and revives nested dates", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [
          {
            id: "a",
            name: "Elf",
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
          },
        ],
        nextCursor: "next",
      })
    )
  );
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const options = publicAncestriesInfiniteQueryOptions({
    search: "Elf & moon",
    sort: "name",
    source: "C & H",
    creatorId: "creator",
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
  expect(new URL(request.url).pathname).toBe("/_actions/publicAncestries");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    cursor: "cursor/+",
    search: "Elf & moon",
    sort: "name",
    source: "C & H",
    creatorId: "creator",
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
  });
  expect(options.getNextPageParam(result)).toBe("next");
});

it("isolates filters and creators in the cache, surfaces typed errors and recovers", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetch = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify({ data: [], nextCursor: null }))
    );
  vi.stubGlobal("fetch", fetch);
  const options = publicAncestriesInfiniteQueryOptions({ creatorId: "one" });
  try {
    await client.fetchInfiniteQuery(options);
    expect(
      client.getQueryData(
        publicAncestriesInfiniteQueryOptions({ creatorId: "two" }).queryKey
      )
    ).toBeUndefined();
    expect(
      client.getQueryData(
        publicAncestriesInfiniteQueryOptions({ creatorId: "one", source: "C" })
          .queryKey
      )
    ).toBeUndefined();
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
