import { afterEach, describe, expect, it, vi } from "vitest";
import { call } from "@/lib/contract";
import {
  type SaveCollectionInput,
  type SaveEncounterInput,
  saveCollection,
  saveEncounter,
} from "./contract";

const encounterInput = {
  name: "Bridge Ambush",
  visibility: "private",
  heroCount: 4,
  heroLevel: 3,
  monsters: [],
} satisfies SaveEncounterInput;
const collectionInput = {
  name: "Campaign Kit",
  visibility: "private",
  monsterIds: [],
  itemIds: [],
  companionIds: [],
  ancestryIds: [],
  backgroundIds: [],
  subclassIds: [],
  spellSchoolIds: [],
  classIds: [],
} satisfies SaveCollectionInput;

afterEach(() => vi.unstubAllGlobals());

describe("editor client transport", () => {
  it.each([
    ["/_actions/saveEncounter", encounterInput, saveEncounter],
    ["/_actions/saveCollection", collectionInput, saveCollection],
  ])("uses stable JSON URL %s without a Next Action header", async (path, input, contract) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "saved-id", name: input.name }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    if (contract === saveEncounter) {
      await call(saveEncounter, encounterInput);
    } else {
      await call(saveCollection, collectionInput);
    }

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(path);
    expect(options).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(options.headers).not.toHaveProperty("next-action");
  });
});
