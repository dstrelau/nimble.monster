import { afterEach, describe, expect, it, vi } from "vitest";
import { call } from "@/lib/contract";
import type { CreateAncestryInput } from "@/lib/services/ancestries/types";
import { createAncestry, updateAncestry } from "./contract";

const input = {
  name: "Starfolk",
  description: "Born beneath unfamiliar stars.",
  size: ["small", "large"],
  rarity: "exotic",
  visibility: "private",
  abilities: [],
} satisfies CreateAncestryInput;

afterEach(() => vi.unstubAllGlobals());

describe("ancestry client transport", () => {
  it.each([
    "create",
    "update",
  ])("%s uses a stable JSON URL, never next-action", async (operation) => {
    const result = {
      id: "33333333-3333-3333-3333-333333333333",
      name: input.name,
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(result));
    vi.stubGlobal("fetch", fetchMock);
    const body = operation === "create" ? input : { id: result.id, input };
    const actual =
      operation === "create"
        ? await call(createAncestry, input)
        : await call(updateAncestry, { id: result.id, input });
    expect(actual).toEqual(result);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`/_actions/${operation}Ancestry`);
    expect(options).toEqual({
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(new Headers(options.headers).has("next-action")).toBe(false);
  });
});
