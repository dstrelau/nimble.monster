import { afterEach, describe, expect, it, vi } from "vitest";
import { call, defineRoute } from "./contract";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("call", () => {
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

    await expect(call(route, undefined)).rejects.toThrow("Not found");
  });
});
