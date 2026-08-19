import { afterEach, describe, expect, it, vi } from "vitest";
import { call } from "@/lib/contract";
import {
  type CreateBestiaryEntryInput,
  createBestiaryEntry,
  type UpdateBestiaryEntryInput,
  updateBestiaryEntry,
} from "./contract";

const createInput = {
  kind: "hazard",
  input: {
    name: "Falling Rocks",
    level: "1",
    levelInt: 1,
    actions: [],
    abilities: [],
    actionPreface: "",
    visibility: "private",
  },
} satisfies CreateBestiaryEntryInput;

const updateInput = {
  kind: "hazard",
  input: {
    ...createInput.input,
    id: "550e8400-e29b-41d4-a716-446655440000",
    moreInfo: "",
  },
} satisfies UpdateBestiaryEntryInput;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bestiary client transport", () => {
  async function expectStableJsonRequest(
    invoke: () => Promise<unknown>,
    input: CreateBestiaryEntryInput | UpdateBestiaryEntryInput,
    path: string
  ) {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "entry-id",
          name: "Falling Rocks",
          hazard: true,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await invoke();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(path);
    expect(options).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(options.headers).not.toHaveProperty("next-action");
  }

  it("uses a stable JSON route to create", async () => {
    await expectStableJsonRequest(
      () => call(createBestiaryEntry, createInput),
      createInput,
      "/_actions/createBestiaryEntry"
    );
  });

  it("uses a stable JSON route to update", async () => {
    await expectStableJsonRequest(
      () => call(updateBestiaryEntry, updateInput),
      updateInput,
      "/_actions/updateBestiaryEntry"
    );
  });
});
