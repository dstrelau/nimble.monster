import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import type { FamilyOverview } from "@/lib/types";
import { useUserFamiliesQuery } from "./hooks";

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const families = (name: string): FamilyOverview[] => [
  {
    id: name,
    name,
    visibility: "private",
    abilities: [{ id: "ability", name: "Cooperation", description: "Shared" }],
    monsterCount: 3,
    creatorId: "discord-owner",
    creator: {
      id: "owner",
      discordId: "discord-owner",
      username: "owner",
      displayName: "Owner",
    },
  },
];

it("uses a bodyless cancellable stable GET without client identity or next-action", async () => {
  const fetcher = vi.fn(async (_url: string, _options: RequestInit) =>
    Response.json(families("Alpha"))
  );
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(
    () => useUserFamiliesQuery({ userId: "owner" }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.data).toEqual(families("Alpha")));
  expect(fetcher).toHaveBeenCalledWith("/_actions/getUserFamilies", {
    method: "GET",
    credentials: "same-origin",
    signal: expect.any(AbortSignal),
  });
  const options = fetcher.mock.calls[0][1];
  expect(options).not.toHaveProperty("body");
  expect(new Headers(options.headers).has("next-action")).toBe(false);
});

it("separates account caches, cancels old reads, hides data on sign-out and honors disabled queries", async () => {
  let finish: (response: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetcher = vi.fn(async (_url: string, _options: RequestInit) =>
    Response.json(families("Alpha"))
  );
  vi.stubGlobal("fetch", fetcher);
  const initialProps: { userId: string | undefined; enabled?: boolean } = {
    userId: undefined,
    enabled: true,
  };
  const { result, rerender } = renderHook(
    (props: { userId: string | undefined; enabled?: boolean }) =>
      useUserFamiliesQuery(props),
    { wrapper, initialProps }
  );
  expect(fetcher).not.toHaveBeenCalled();
  rerender({ userId: "owner", enabled: false });
  expect(fetcher).not.toHaveBeenCalled();
  rerender({ userId: "owner", enabled: true });
  await waitFor(() => expect(result.current.data).toEqual(families("Alpha")));
  fetcher.mockImplementationOnce(() => pending);
  rerender({ userId: "other", enabled: true });
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  const signal = fetcher.mock.calls[1][1].signal;
  rerender({ userId: undefined, enabled: true });
  expect(signal?.aborted).toBe(true);
  expect(result.current.data).toBeUndefined();
  finish(Response.json(families("Other")));
  expect(client.getQueryData(["user-families", "owner"])).toEqual(
    families("Alpha")
  );
  expect(client.getQueryData(["user-families", "other"])).toBeUndefined();
});

it("retains choices during failed background reads and recovers without losing cached data", async () => {
  const fetcher = vi.fn(async () => Response.json(families("Alpha")));
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(
    () => ({ ...useUserFamiliesQuery({ userId: "owner" }) }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.data).toEqual(families("Alpha")));
  fetcher.mockResolvedValueOnce(
    Response.json({ error: "Unavailable" }, { status: 503 })
  );
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.error).toBeInstanceOf(RouteError));
  expect(result.current.error).toMatchObject({ status: 503, code: "HTTP_503" });
  expect(result.current.data).toEqual(families("Alpha"));
  fetcher.mockResolvedValueOnce(Response.json(families("Recovered")));
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() =>
    expect(result.current.data).toEqual(families("Recovered"))
  );
  expect(result.current.isError).toBe(false);
});
