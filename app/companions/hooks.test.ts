import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { publicCompanionsInfiniteQueryOptions } from "./hooks";

afterEach(() => vi.unstubAllGlobals());
const date = "2026-09-01T12:00:00.000Z";
const page = (id: string, nextCursor: string | null = null) => ({
  data: [
    {
      id,
      updatedAt: date,
      source: { createdAt: date, updatedAt: date },
      awards: [{ createdAt: date, updatedAt: date }],
    },
  ],
  nextCursor,
});

it("uses a stable bodyless GET, encodes filters/cursor, revives dates and preserves pagination keys", async () => {
  const fetcher = vi.fn(async (_url: string, _options: RequestInit) =>
    Response.json(page("first", "next"))
  );
  vi.stubGlobal("fetch", fetcher);
  const signal = new AbortController().signal;
  const options = publicCompanionsInfiniteQueryOptions({
    search: "Bird & Wolf",
    class: "The Cheat",
    sort: "name",
    limit: 2,
  });
  const result = await options.queryFn({ pageParam: "a+/=", signal });
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe(
    "/_actions/publicCompanions?cursor=a%2B%2F%3D&search=Bird+%26+Wolf&sort=name&class=The+Cheat&limit=2"
  );
  expect(init).toEqual({ method: "GET", credentials: "same-origin", signal });
  expect(new Headers(init.headers).has("next-action")).toBe(false);
  expect(init.body).toBeUndefined();
  expect(result.data[0].updatedAt).toEqual(new Date(date));
  expect(result.data[0].source?.createdAt).toEqual(new Date(date));
  expect(result.data[0].source?.updatedAt).toEqual(new Date(date));
  expect(result.data[0].awards?.[0].createdAt).toEqual(new Date(date));
  expect(result.data[0].awards?.[0].updatedAt).toEqual(new Date(date));
  expect(options.getNextPageParam(result)).toBe("next");
  expect(options.queryKey).toEqual([
    "companions",
    { search: "Bird & Wolf", class: "The Cheat", sort: "name", limit: 2 },
  ]);
  expect(
    publicCompanionsInfiniteQueryOptions({ search: "other" }).queryKey
  ).not.toEqual(options.queryKey);
});

it("retains pages after failed refetch, surfaces typed errors, and recovers", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetcher = vi.fn(async () => Response.json(page("first", "next")));
  vi.stubGlobal("fetch", fetcher);
  try {
    const options = publicCompanionsInfiniteQueryOptions();
    await client.fetchInfiniteQuery(options);
    fetcher.mockResolvedValueOnce(
      Response.json({ error: "Unavailable" }, { status: 503 })
    );
    await expect(client.fetchInfiniteQuery(options)).rejects.toMatchObject({
      status: 503,
      code: "HTTP_503",
    });
    expect(client.getQueryData(options.queryKey)).toMatchObject({
      pages: [{ data: [{ id: "first" }] }],
    });
    fetcher.mockResolvedValueOnce(Response.json(page("recovered")));
    await expect(client.fetchInfiniteQuery(options)).resolves.toMatchObject({
      pages: [{ data: [{ id: "recovered" }], nextCursor: null }],
    });
  } finally {
    client.clear();
  }
});

it("aborts a pending read when its last observer leaves", () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  let signal: AbortSignal | null | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal;
      return new Promise<Response>(() => {});
    })
  );
  const observer = new InfiniteQueryObserver(
    client,
    publicCompanionsInfiniteQueryOptions()
  );
  const unsubscribe = observer.subscribe(() => {});
  expect(signal?.aborted).toBe(false);
  unsubscribe();
  expect(signal?.aborted).toBe(true);
  client.clear();
});
