import { afterEach, describe, expect, it, vi } from "vitest";
import { call } from "@/lib/contract";
import {
  type CreateBestiaryEntryInput,
  createBestiaryEntry,
  type UpdateBestiaryEntryInput,
  updateBestiaryEntry,
} from "./contract";
import { createBestiaryEntrySchema, updateBestiaryEntrySchema } from "./input";

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

describe("hazard HP validation", () => {
  it.each([
    undefined,
    1,
    37,
  ])("accepts optional HP %s for create and update", (hp) => {
    expect(
      createBestiaryEntrySchema.parse({
        ...createInput,
        input: { ...createInput.input, hp },
      }).input
    ).toHaveProperty("hp", hp);
    expect(
      updateBestiaryEntrySchema.parse({
        ...updateInput,
        input: { ...updateInput.input, hp },
      }).input
    ).toHaveProperty("hp", hp);
  });

  it.each([0, -1, 1.5, null, "37"])("rejects invalid HP %s", (hp) => {
    expect(
      createBestiaryEntrySchema.safeParse({
        ...createInput,
        input: { ...createInput.input, hp },
      }).success
    ).toBe(false);
    expect(
      updateBestiaryEntrySchema.safeParse({
        ...updateInput,
        input: { ...updateInput.input, hp },
      }).success
    ).toBe(false);
  });
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
