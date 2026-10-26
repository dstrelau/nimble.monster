import { afterEach, describe, expect, it, vi } from "vitest";
import { call, defineRoute, RouteError } from "./contract";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("call", () => {
  it("supports void responses and forwards cancellation", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const route = defineRoute<undefined, void>({
      method: "DELETE",
      path: () => "/_actions/test",
    });
    const { signal } = new AbortController();
    expect(await call(route, undefined, { signal })).toBeUndefined();
    expect(fetch.mock.calls[0][1].signal).toBe(signal);
  });

  it("retains HTTP status and a stable failure code", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "Unavailable", code: "UNAVAILABLE" },
            { status: 503 }
          )
        )
    );
    const route = defineRoute<undefined, never>({
      method: "GET",
      path: () => "/_actions/test",
    });
    await expect(call(route, undefined)).rejects.toMatchObject({
      name: "RouteError",
      message: "Unavailable",
      status: 503,
      code: "UNAVAILABLE",
    });
    expect(RouteError.prototype).toBeInstanceOf(Error);
  });

  it("sends bodyless GET requests with same-origin credentials and no Server Action header", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [] })));
    vi.stubGlobal("fetch", fetch);
    const route = defineRoute<undefined, { data: unknown[] }>({
      method: "GET",
      path: () => "/_actions/myAncestries?limit=12",
    });
    expect(await call(route, undefined)).toEqual({ data: [] });
    expect(fetch).toHaveBeenCalledWith("/_actions/myAncestries?limit=12", {
      method: "GET",
      credentials: "same-origin",
    });
  });

  it("posts JSON to the stable route without a Server Action header", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "table-id", name: "Weather" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetch);
    const route = defineRoute<{ name: string }, { id: string; name: string }>({
      method: "POST",
      path: () => "/_actions/saveRandomTable",
    });

    await expect(call(route, { name: "Weather" })).resolves.toEqual({
      id: "table-id",
      name: "Weather",
    });
    expect(fetch).toHaveBeenCalledWith("/_actions/saveRandomTable", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Weather" }),
    });
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("next-action");
  });

  it("throws the JSON error returned by the route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    const route = defineRoute<undefined, never>({
      method: "POST",
      path: () => "/_actions/test",
    });

    await expect(call(route, undefined)).rejects.toMatchObject({
      message: "Not found",
      status: 404,
      code: "HTTP_404",
    });
  });
});
