import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { RouteError } from "@/lib/contract";
import { subclassClassOptionsQueryOptions } from "./hooks";

afterEach(() => vi.unstubAllGlobals());

it("uses a cancellable bodyless stable GET with encoded search and no client identity", async () => {
  const options = [{ id: "one", name: "Rock & Ice + 雪", bucket: "owned" }];
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(options)));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const result = await subclassClassOptionsQueryOptions(
    "Rock & Ice + 雪",
    "owner"
  ).queryFn({ signal: controller.signal });
  expect(result).toEqual(options);
  const [url, init] = fetch.mock.calls[0];
  const request = new Request(new URL(url, "https://nimble.nexus"), init);
  expect(new URL(request.url).pathname).toBe(
    "/_actions/searchClassesForSubclass"
  );
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
    searchTerm: "Rock & Ice + 雪",
  });
  expect(request.method).toBe("GET");
  expect(request.body).toBeNull();
  expect(request.headers.has("next-action")).toBe(false);
  expect(request.headers.has("content-type")).toBe(false);
  expect(init.signal).toBe(controller.signal);
  expect(init.credentials).toBe("same-origin");
});

it("isolates sessions/searches, retains choices on a failed refetch and recovers", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rows = [{ id: "private", bucket: "owned" }];
  const fetch = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify(rows)));
  vi.stubGlobal("fetch", fetch);
  const owner = subclassClassOptionsQueryOptions(undefined, "owner");
  try {
    await client.fetchQuery(owner);
    expect(fetch.mock.calls[0][0]).toBe("/_actions/searchClassesForSubclass");
    for (const options of [
      subclassClassOptionsQueryOptions(),
      subclassClassOptionsQueryOptions("", "other"),
      subclassClassOptionsQueryOptions("Mage", "owner"),
    ]) {
      expect(client.getQueryData(options.queryKey)).toBeUndefined();
    }
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      })
    );
    await expect(client.fetchQuery(owner)).rejects.toEqual(
      new RouteError("Internal Server Error", 500, "HTTP_500")
    );
    expect(client.getQueryData(owner.queryKey)).toEqual(rows);
    await expect(client.fetchQuery(owner)).resolves.toEqual(rows);
  } finally {
    client.clear();
  }
});

it("cancels obsolete in-flight reads when the observer releases them", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url, init) => {
      signal = init.signal;
      return new Promise((_resolve, reject) =>
        signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        )
      );
    })
  );
  const options = subclassClassOptionsQueryOptions("Mage", "owner");
  try {
    const pending = client.fetchQuery(options).catch(() => undefined);
    await client.cancelQueries({ queryKey: options.queryKey });
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(client.getQueryData(options.queryKey)).toBeUndefined();
  } finally {
    client.clear();
  }
});
