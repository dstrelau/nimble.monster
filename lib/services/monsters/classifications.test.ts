import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  createBestiaryEntrySchema,
  updateBestiaryEntrySchema,
} from "@/app/%5Factions/_bestiary/input";
import { GET as getMonster } from "@/app/api/monsters/[id]/route";
import {
  GET as listMonsters,
  POST as postMonster,
} from "@/app/api/monsters/route";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { uuidToIdentifier } from "@/lib/utils/slug";
import type { MonsterClassifications } from "./classifications";
import { toJsonApiMonster } from "./converters";
import { compareMonsters } from "./diff";
import {
  OFFICIAL_USER_ID,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "./official";
import {
  createHazard,
  createMonster,
  findMonster,
  updateMonster,
  upsertOfficialMonster,
} from "./repository";
import type { UpdateMonsterInput } from "./types";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: unknown) => handler,
}));

let client: Client;
let directory: string;
const ownerId = "11111111-1111-4111-8111-111111111111";
const officialJSON = JSON.parse(
  readFileSync("data/official/gmg/bestiary.json", "utf8")
);
const { monsters: officialMonsters } =
  validateOfficialMonstersJSON(officialJSON);
const officialMonster = officialMonsters.find(
  (monster) => monster.attributes.name === "Ogre Zombie"
);
if (!officialMonster) throw new Error("Missing official Ogre Zombie fixture");
const input = parseJSONAPIMonster(officialMonster);
const classifications = {
  creatureTypes: ["undead", "giant"],
  creatureKinds: ["zombie", "ogre"],
  environments: ["graveyard", "ruins", "underground"],
} satisfies MonsterClassifications;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "monster-classifications-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
  await db.insert(schema.users).values([
    { id: ownerId, username: "owner", discordId: "owner" },
    { id: OFFICIAL_USER_ID, username: "nimble-co" },
  ]);
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe("monster classifications", () => {
  it("persists multiple values and exposes them in list and detail APIs only when set", async () => {
    expect(
      createBestiaryEntrySchema.parse({
        kind: "monster",
        input: { ...input, ...classifications },
      }).input
    ).toMatchObject(classifications);
    const classified = await createMonster(
      {
        ...input,
        ...classifications,
        creatureTypes: ["undead", "giant", "undead"],
      },
      "owner"
    );
    expect(await findMonster(classified.id)).toMatchObject(classifications);
    const unclassified = await createMonster(input, "owner");
    expect(await findMonster(unclassified.id)).toMatchObject({
      creatureTypes: [],
      creatureKinds: [],
      environments: [],
    });

    const list = await listMonsters(
      new Request("http://localhost/api/monsters")
    );
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(body.data).toContainEqual(
      expect.objectContaining({
        id: uuidToIdentifier(classified.id),
        attributes: expect.objectContaining(classifications),
      })
    );
    const identifier = uuidToIdentifier(classified.id);
    const detail = await getMonster(
      new Request(`http://localhost/api/monsters/${identifier}`),
      { params: Promise.resolve({ id: identifier }) }
    );
    expect(detail.status).toBe(200);
    const attributes = (await detail.json()).data.attributes;
    expect(attributes).toMatchObject({ ...classifications, kind: input.kind });
    expect(attributes).not.toHaveProperty("creatureGroups");
    expect(attributes).not.toHaveProperty("creatureKind");
    const unclassifiedAttributes = toJsonApiMonster(unclassified).attributes;
    expect(unclassifiedAttributes).toHaveProperty("kind", input.kind);
    for (const field of Object.keys(classifications)) {
      expect(unclassifiedAttributes).not.toHaveProperty(field);
    }

    await getDatabase()
      .update(schema.monsters)
      .set({ visibility: "private" })
      .where(eq(schema.monsters.id, classified.id));
    const privateDetail = await getMonster(
      new Request(`http://localhost/api/monsters/${identifier}`),
      { params: Promise.resolve({ id: identifier }) }
    );
    expect(privateDetail.status).toBe(404);
  });

  it("preserves omitted assignments on editor saves and changes or clears only supplied fields", async () => {
    const monster = await createMonster(
      { ...input, ...classifications },
      "owner"
    );
    const updateInput = {
      ...input,
      id: monster.id,
      armor: monster.armor,
      kind: monster.kind ?? "",
      legendary: monster.legendary,
      minion: monster.minion,
      bloodied: monster.bloodied ?? "",
      lastStand: monster.lastStand ?? "",
      saves: [],
      actionPreface: monster.actionPreface,
      moreInfo: monster.moreInfo ?? "",
    } satisfies UpdateMonsterInput;
    expect(
      updateBestiaryEntrySchema.parse({
        kind: "monster",
        input: { ...updateInput, ...classifications },
      }).input
    ).toMatchObject(classifications);
    expect(await updateMonster(updateInput, "owner")).toMatchObject(
      classifications
    );
    expect(
      await updateMonster(
        { ...updateInput, creatureTypes: [], environments: ["swamp"] },
        "owner"
      )
    ).toMatchObject({
      creatureTypes: [],
      creatureKinds: ["zombie", "ogre"],
      environments: ["swamp"],
    });
  });

  it("round-trips official imports without erasing assignments on legacy re-imports", async () => {
    const imported = parseJSONAPIMonster({
      ...officialMonster,
      attributes: { ...officialMonster.attributes, ...classifications },
    });
    const monster = await upsertOfficialMonster(imported);
    expect(monster).toMatchObject(classifications);
    expect(await upsertOfficialMonster(input)).toMatchObject(classifications);
    const changed = await upsertOfficialMonster({
      ...input,
      creatureKinds: [],
    });
    expect(changed).toMatchObject({ ...classifications, creatureKinds: [] });
    expect(changed.id).toBe(monster.id);
    expect(
      compareMonsters({ ...monster, creatureTypes: undefined }, monster)
    ).toBe("unchanged");
    expect(compareMonsters({ ...monster, creatureTypes: [] }, monster)).toBe(
      "updated"
    );
    expect(
      compareMonsters(
        { ...monster, creatureTypes: ["giant", "undead"] },
        monster
      )
    ).toBe("unchanged");
  });

  it.each([
    { creatureTypes: ["goblinoid"] },
    { creatureKinds: ["forest"] },
    { environments: "forest" },
    { creatureTypes: null },
    { environments: ["FOREST"] },
  ])("rejects invalid classifications at write and import boundaries: %j", async (invalid) => {
    expect(
      createBestiaryEntrySchema.safeParse({
        kind: "monster",
        input: { ...input, ...invalid },
      }).success
    ).toBe(false);
    expect(
      updateBestiaryEntrySchema.safeParse({
        kind: "monster",
        input: {
          ...input,
          id: ownerId,
          armor: "none",
          kind: "Undead",
          legendary: false,
          minion: false,
          bloodied: "",
          lastStand: "",
          saves: [],
          actionPreface: "",
          moreInfo: "",
          ...invalid,
        },
      }).success
    ).toBe(false);
    expect(() =>
      validateOfficialMonstersJSON({
        ...officialJSON,
        data: [
          {
            ...officialMonster,
            attributes: { ...officialMonster.attributes, ...invalid },
          },
        ],
      })
    ).toThrow(z.ZodError);

    mockAuth.mockResolvedValue({
      user: { id: ownerId, discordId: "owner" },
      expires: "2099-01-01",
    });
    const response = await postMonster(
      new Request("http://localhost/api/monsters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, ...invalid }),
      })
    );
    expect(response.status).toBe(400);
    expect(await getDatabase().select().from(schema.monsters)).toHaveLength(0);
  });

  it("ignores creature classifications on hazards", async () => {
    const hazard = await createHazard(
      { ...input, ...classifications },
      "owner"
    );
    const [row] = await getDatabase()
      .select()
      .from(schema.monsters)
      .where(eq(schema.monsters.id, hazard.id));
    expect(row).toMatchObject({
      creatureTypes: [],
      creatureKinds: [],
      environments: [],
    });
    for (const field of Object.keys(classifications)) {
      expect(toJsonApiMonster(hazard).attributes).not.toHaveProperty(field);
    }
  });
});
