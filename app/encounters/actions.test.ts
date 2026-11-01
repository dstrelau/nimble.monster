import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { publicEncountersInfiniteQueryOptions } from "./actions";

const fetchMock = vi.fn<typeof fetch>();
const date = "2026-10-01T12:00:00.000Z";
const page = {
  data: [
    {
      id: "encounter",
      createdAt: date,
      monsters: [
        {
          monster: { id: "monster", createdAt: date },
          quantity: 3,
          isPerHero: true,
          heroesPerMonster: 2,
        },
      ],
    },
  ],
  hasMore: true,
};
afterEach(() => vi.unstubAllGlobals());

it("uses a cancellable stable bodyless GET, encodes filters and revives nested dates", async () => {
  vi.stubGlobal(
    "fetch",
    fetchMock.mockResolvedValue(new Response(JSON.stringify(page)))
  );
  const signal = new AbortController().signal;
  const options = publicEncountersInfiniteQueryOptions({
    search: "Moon & Sun + #",
    sort: "-name",
    limit: 3,
    creatorId: "public creator",
  });
  const result = await options.queryFn({ pageParam: 2, signal });
  const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
  expect(new URL(String(url), "https://nimble.nexus").pathname).toBe(
    "/_actions/publicEncounters"
  );
  expect(
    Object.fromEntries(
      new URL(String(url), "https://nimble.nexus").searchParams
    )
  ).toEqual({
    pageParam: "2",
    search: "Moon & Sun + #",
    sort: "-name",
    limit: "3",
    creatorId: "public creator",
  });
  expect(init).toMatchObject({
    method: "GET",
    credentials: "same-origin",
    signal,
  });
  expect(init?.body).toBeUndefined();
  expect(new Headers(init?.headers).has("next-action")).toBe(false);
  expect(result.data[0].createdAt).toEqual(new Date(date));
  expect(result.data[0].monsters[0]).toMatchObject({
    monster: { createdAt: new Date(date) },
    quantity: 3,
    isPerHero: true,
    heroesPerMonster: 2,
  });
  expect(options.getNextPageParam(result, [result], 2)).toBe(3);
  expect(
    options.getNextPageParam({ ...result, hasMore: false }, [result], 2)
  ).toBeUndefined();
});

it("keeps filter/creator caches separate and retains cached pages through failure and recovery", async () => {
  vi.stubGlobal(
    "fetch",
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(page)))
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  try {
    const options = publicEncountersInfiniteQueryOptions({ creatorId: "one" });
    const other = publicEncountersInfiniteQueryOptions({ creatorId: "two" });
    expect(options.queryKey).not.toEqual(other.queryKey);
    expect(options.queryKey).not.toEqual(
      publicEncountersInfiniteQueryOptions({ creatorId: "one", search: "Moon" })
        .queryKey
    );
    const before = await client.fetchInfiniteQuery(options);
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: "Internal Server Error" }), {
          status: 500,
        })
    );
    await expect(client.fetchInfiniteQuery(options)).rejects.toMatchObject({
      status: 500,
      code: "HTTP_500",
    });
    expect(client.getQueryData(options.queryKey)).toEqual(before);
    expect(client.getQueryData(other.queryKey)).toBeUndefined();
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ data: [], hasMore: false }))
    );
    expect(await client.fetchInfiniteQuery(options)).toMatchObject({
      pages: [{ data: [], hasMore: false }],
    });
  } finally {
    client.clear();
  }
});

it("propagates cancellation and typed request failures without replacing them with empty pages", async () => {
  vi.stubGlobal(
    "fetch",
    fetchMock.mockImplementation(async (_url, init) => {
      init?.signal?.throwIfAborted();
      return new Response(
        JSON.stringify({ error: "Invalid encounter search" }),
        { status: 400 }
      );
    })
  );
  const options = publicEncountersInfiniteQueryOptions();
  await expect(options.queryFn({ pageParam: 0 })).rejects.toBeInstanceOf(
    RouteError
  );
  const controller = new AbortController();
  controller.abort();
  await expect(
    options.queryFn({ pageParam: 0, signal: controller.signal })
  ).rejects.toMatchObject({ name: "AbortError" });
});
