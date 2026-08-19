import { afterEach, describe, expect, it, vi } from "vitest";
import { call } from "@/lib/contract";
import type { CreateItemInput } from "@/lib/services/items";
import { createItem, updateItem } from "./contract";

const input = {
  name: "Lucky Coin",
  description: "A coin that always lands edge-up.",
  visibility: "private",
} satisfies CreateItemInput;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("item client transport", () => {
  async function assertRequest(
    invoke: () => Promise<unknown>,
    expectedPath: string,
    expectedBody: unknown
  ) {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "item-id", name: input.name }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await invoke();

    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe(expectedPath);
    expect(options).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedBody),
    });
    expect(options.headers).not.toHaveProperty("next-action");
  }

  it("creates over a stable JSON URL", async () => {
    await assertRequest(
      () => call(createItem, input),
      "/_actions/createItem",
      input
    );
  });

  it("updates over a stable JSON URL", async () => {
    const request = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      input,
    };
    await assertRequest(
      () => call(updateItem, request),
      "/_actions/updateItem",
      request
    );
  });
});
