import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { publicBackgroundsInfiniteQueryOptions } from "./hooks";

afterEach(() => vi.unstubAllGlobals());
const date = "2026-09-01T12:00:00.000Z";
const page = (id: string, nextCursor: string | null = null) => ({
  data: [
    {
      id,
      createdAt: date,
      updatedAt: date,
      source: { createdAt: date, updatedAt: date },
      awards: [{ createdAt: date, updatedAt: date }],
    },
  ],
  nextCursor,
});

it("uses stable bodyless GETs, encodes all filters and cursor, and revives all dates", async () => {
  const fetcher = vi.fn(async (_url: string, _options: RequestInit) =>
    Response.json(page("first", "next"))
  );
  vi.stubGlobal("fetch", fetcher);
  const signal = new AbortController().signal;
  const options = publicBackgroundsInfiniteQueryOptions({
    search: "Bird & Wolf",
    source: "C+",
    creatorId: "owner",
    sort: "name",
    limit: 2,
  });
  const result = await options.queryFn({ pageParam: "a+/=", signal });
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe(
    "/_actions/publicBackgrounds?cursor=a%2B%2F%3D&search=Bird+%26+Wolf&sort=name&source=C%2B&creatorId=owner&limit=2"
  );
  expect(init).toEqual({ method: "GET", credentials: "same-origin", signal });
  expect(new Headers(init.headers).has("next-action")).toBe(false);
  expect(init.body).toBeUndefined();
  expect(result.data[0].createdAt).toEqual(new Date(date));
  expect(result.data[0].updatedAt).toEqual(new Date(date));
  expect(result.data[0].source?.createdAt).toEqual(new Date(date));
  expect(result.data[0].source?.updatedAt).toEqual(new Date(date));
  expect(result.data[0].awards?.[0].createdAt).toEqual(new Date(date));
  expect(result.data[0].awards?.[0].updatedAt).toEqual(new Date(date));
  expect(options.getNextPageParam(result)).toBe("next");
  expect(options.queryKey).toEqual([
    "backgrounds",
    {
      search: "Bird & Wolf",
      source: "C+",
      creatorId: "owner",
      sort: "name",
      limit: 2,
    },
  ]);
  expect(
    publicBackgroundsInfiniteQueryOptions({ creatorId: "other" }).queryKey
  ).not.toEqual(options.queryKey);
  expect(publicBackgroundsInfiniteQueryOptions().queryKey).toEqual([
    "backgrounds",
    {
      search: undefined,
      sort: "-createdAt",
      source: undefined,
      creatorId: undefined,
      limit: 12,
    },
  ]);
});

it("retains pages during a pending or failed refetch, reports HTTP errors and recovers", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetcher = vi.fn(async () => Response.json(page("first", "next")));
  vi.stubGlobal("fetch", fetcher);
  try {
    const options = publicBackgroundsInfiniteQueryOptions();
    await client.fetchInfiniteQuery(options);
    let finish: (response: Response) => void = () => {};
    fetcher.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    const pending = client.fetchInfiniteQuery(options);
    expect(client.getQueryData(options.queryKey)).toMatchObject({
      pages: [{ data: [{ id: "first" }] }],
    });
    finish(Response.json({ error: "Unavailable" }, { status: 503 }));
    await expect(pending).rejects.toMatchObject({
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
    publicBackgroundsInfiniteQueryOptions()
  );
  const unsubscribe = observer.subscribe(() => {});
  expect(signal?.aborted).toBe(false);
  unsubscribe();
  expect(signal?.aborted).toBe(true);
  client.clear();
});
