import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { EntityType } from "./types";

vi.mock("./actions", () => ({ getAllSources: vi.fn() }));

import { useSourcesForEntityTypeQuery } from "./hooks";

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
const rows = (name: string) => [{ id: name, name, abbreviation: name }];

it.each<EntityType>([
  "monsters",
  "ancestries",
  "backgrounds",
  "classes",
  "subclasses",
  "spell_schools",
])(
  "loads %s over a stable bodyless GET with no next-action header",
  async (entityType) => {
    const fetcher = vi.fn(async (_url: string, _options: RequestInit) =>
      Response.json(rows(entityType))
    );
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(
      () => useSourcesForEntityTypeQuery(entityType),
      {
        wrapper,
      }
    );
    await waitFor(() => expect(result.current.data).toEqual(rows(entityType)));
    expect(fetcher).toHaveBeenCalledWith(
      `/_actions/getSourcesForEntityType?entityType=${entityType}`,
      {
        method: "GET",
        credentials: "same-origin",
        signal: expect.any(AbortSignal),
      }
    );
    for (const [, options] of fetcher.mock.calls) {
      expect(options).not.toHaveProperty("headers");
      expect(options).not.toHaveProperty("body");
    }
  }
);

it("isolates entity caches, honors disabled queries, and reuses fresh results", async () => {
  const fetcher = vi.fn(async (url: string) =>
    Response.json(
      rows(url.endsWith("=classes") ? "Class source" : "Monster source")
    )
  );
  vi.stubGlobal("fetch", fetcher);
  const { result, rerender } = renderHook(
    ({ entityType, enabled }: { entityType: EntityType; enabled: boolean }) =>
      useSourcesForEntityTypeQuery(entityType, { enabled }),
    { wrapper, initialProps: { entityType: "monsters", enabled: false } }
  );
  expect(fetcher).not.toHaveBeenCalled();
  rerender({ entityType: "monsters", enabled: true });
  await waitFor(() =>
    expect(result.current.data).toEqual(rows("Monster source"))
  );
  rerender({ entityType: "classes", enabled: true });
  expect(result.current.data).toBeUndefined();
  await waitFor(() =>
    expect(result.current.data).toEqual(rows("Class source"))
  );
  rerender({ entityType: "monsters", enabled: true });
  expect(result.current.data).toEqual(rows("Monster source"));
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("retains prior options on a failed background read and supports recovery", async () => {
  const fetcher = vi.fn(async () => Response.json(rows("First")));
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useSourcesForEntityTypeQuery("classes"), {
    wrapper,
  });
  await waitFor(() => expect(result.current.data).toEqual(rows("First")));
  expect(result.current.error).toBeNull();
  fetcher.mockResolvedValueOnce(
    Response.json({ error: "Unavailable" }, { status: 503 })
  );
  await act(() => result.current.refetch());
  expect(result.current.data).toEqual(rows("First"));
  await waitFor(() =>
    expect(result.current.error).toMatchObject({
      status: 503,
      code: "HTTP_503",
    })
  );
  fetcher.mockResolvedValueOnce(Response.json(rows("Recovered")));
  await act(() => result.current.refetch());
  await waitFor(() => expect(result.current.data).toEqual(rows("Recovered")));
});

it("cancels a pending read when its last observer unmounts", async () => {
  let signal: AbortSignal | undefined | null;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal;
      return new Promise<Response>(() => {});
    })
  );
  const { unmount } = renderHook(
    () => useSourcesForEntityTypeQuery("classes"),
    {
      wrapper,
    }
  );
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});
