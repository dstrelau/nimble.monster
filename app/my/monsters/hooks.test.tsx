import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { myMonstersInfiniteQueryOptions } from "./hooks";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const page = (id: string) => ({
  data: [
    {
      id,
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
  nextCursor: null,
});

it("uses stable cancellable GET without session authority or next-action and revives dates", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(page("mine"))));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const options = myMonstersInfiniteQueryOptions("cache-only-owner", {
    search: "Wolf & moon",
    sort: "level",
    source: "C & H",
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
  expect(new URL(request.url).pathname).toBe("/_actions/myMonsters");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    cursor: "cursor/+",
    search: "Wolf & moon",
    sort: "level",
    source: "C & H",
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
  });
});

it("retains same-owner data while filtering, but never across accounts or sign-out", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const fetch = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify(page("one"))));
  vi.stubGlobal("fetch", fetch);
  const initialProps: { userId: string | undefined; search: string } = {
    userId: "one",
    search: "",
  };
  const { result, rerender, unmount } = renderHook(
    ({ userId, search }: { userId: string | undefined; search: string }) =>
      useInfiniteQuery(myMonstersInfiniteQueryOptions(userId, { search })),
    { wrapper, initialProps }
  );
  try {
    await waitFor(() =>
      expect(result.current.data?.pages[0].data[0].id).toBe("one")
    );
    let finish: (response: Response) => void = () => {};
    fetch.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    rerender({ userId: "one", search: "filter" });
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
    expect(result.current.data?.pages[0].data[0].id).toBe("one");
    act(() =>
      finish(
        new Response(JSON.stringify({ error: "Internal Server Error" }), {
          status: 500,
        })
      )
    );
    await waitFor(() =>
      expect(result.current.error).toMatchObject({
        status: 500,
        code: "HTTP_500",
      })
    );
    await act(() => result.current.refetch());
    await waitFor(() =>
      expect(result.current.data?.pages[0].data[0].id).toBe("one")
    );
    fetch.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    rerender({ userId: "two", search: "filter" });
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.data).toBeUndefined();
    rerender({ userId: undefined, search: "filter" });
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
    act(() => finish(new Response(JSON.stringify(page("two")))));
    expect(result.current.data).toBeUndefined();
    fetch.mockImplementation(
      async () => new Response(JSON.stringify(page("three")))
    );
    rerender({ userId: "three", search: "filter" });
    await waitFor(() =>
      expect(result.current.data?.pages[0].data[0].id).toBe("three")
    );
  } finally {
    unmount();
    client.clear();
  }
});
