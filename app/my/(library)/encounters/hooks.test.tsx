import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { myEncountersInfiniteQueryOptions } from "./hooks";

const date = "2026-09-03T12:00:00.000Z";
const row = {
  id: "encounter",
  name: "Owner private",
  visibility: "private",
  heroCount: 3,
  heroLevel: 7,
  createdAt: date,
  creator: {
    id: "owner",
    discordId: "discord-owner",
    username: "owner",
    displayName: "Owner",
  },
  monsters: [
    {
      monster: {
        id: "hazard",
        name: "Pit",
        level: "1",
        levelInt: 1,
        visibility: "public",
        hazard: true,
        createdAt: date,
      },
      quantity: 3,
      isPerHero: true,
      heroesPerMonster: 4,
    },
  ],
};
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}
afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) client.clear();
  vi.unstubAllGlobals();
});

it("uses cancellable stable GETs, encodes filters, revives nested dates and advances offset pages", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      return Response.json({ data: [row], hasMore: requests.length === 1 });
    })
  );
  const { wrapper } = setup();
  const { result } = renderHook(
    () =>
      useInfiniteQuery(
        myEncountersInfiniteQueryOptions("owner", {
          search: "Moon & Sun",
          sort: "-name",
          limit: 3,
        })
      ),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.pages[0].data[0].createdAt).toEqual(
    new Date(date)
  );
  expect(
    result.current.data?.pages[0].data[0].monsters[0].monster.createdAt
  ).toEqual(new Date(date));
  expect(result.current.data?.pages[0].data[0].monsters[0]).toMatchObject({
    quantity: 3,
    isPerHero: true,
    heroesPerMonster: 4,
  });
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  expect(requests).toHaveLength(2);
  for (const [index, { url, init }] of requests.entries()) {
    const parsed = new URL(url, "https://nimble.nexus");
    expect(parsed.pathname).toBe("/_actions/myEncounters");
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      search: "Moon & Sun",
      sort: "-name",
      limit: "3",
      pageParam: String(index),
    });
    expect(init?.method).toBe("GET");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).has("next-action")).toBe(false);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  }
});

it("does not leak previous-owner placeholders on account changes or sign-out and cancels obsolete reads", async () => {
  let signal: AbortSignal | null | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      signal = init?.signal;
      return Response.json({ data: [row], hasMore: false });
    })
  );
  const { wrapper } = setup();
  const initialProps: { userId: string | undefined } = { userId: "owner" };
  const { result, rerender } = renderHook(
    ({ userId }: { userId: string | undefined }) =>
      useInfiniteQuery(myEncountersInfiniteQueryOptions(userId)),
    { wrapper, initialProps }
  );
  await waitFor(() =>
    expect(result.current.data?.pages[0].data[0].id).toBe("encounter")
  );
  let pendingSignal: AbortSignal | null | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      pendingSignal = init?.signal;
      return new Promise<Response>(() => {});
    })
  );
  rerender({ userId: "other" });
  await waitFor(() => expect(pendingSignal).toBeInstanceOf(AbortSignal));
  expect(result.current.data).toBeUndefined();
  expect(signal?.aborted).toBe(false);
  rerender({ userId: undefined });
  await waitFor(() => expect(pendingSignal?.aborted).toBe(true));
  expect(result.current.data).toBeUndefined();
  expect(result.current.fetchStatus).toBe("idle");
});

it("retains failed-refetch data, exposes typed errors and recovers without destroying the cache", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: [row], hasMore: false }))
    .mockResolvedValueOnce(
      Response.json({ error: "Try again" }, { status: 503 })
    )
    .mockResolvedValueOnce(
      Response.json({ data: [{ ...row, name: "Recovered" }], hasMore: false })
    );
  vi.stubGlobal("fetch", fetch);
  const { wrapper } = setup();
  const { result } = renderHook(
    () => useInfiniteQuery(myEncountersInfiniteQueryOptions("owner")),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.error).toBeInstanceOf(RouteError));
  expect(result.current.error).toMatchObject({ status: 503, code: "HTTP_503" });
  expect(result.current.data?.pages[0].data[0].name).toBe("Owner private");
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.error).toBeNull());
  expect(result.current.data?.pages[0].data[0].name).toBe("Recovered");
});

it("does not request private data without a signed-in identity", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const { wrapper } = setup();
  const { result } = renderHook(
    () => useInfiniteQuery(myEncountersInfiniteQueryOptions(undefined)),
    { wrapper }
  );
  expect(result.current.fetchStatus).toBe("idle");
  expect(fetch).not.toHaveBeenCalled();
});
