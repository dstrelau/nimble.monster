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
import { POST as postMonster } from "@/app/api/monsters/route";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { uuidToIdentifier } from "@/lib/utils/slug";
import { toJsonApiMonster } from "./converters";
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
import type { Monster, UpdateMonsterInput } from "./types";

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
const officialMonster = validateOfficialMonstersJSON(
  officialJSON
).monsters.find((monster) => monster.attributes.name === "Ogre Zombie");
if (!officialMonster) throw new Error("Missing official Ogre Zombie fixture");
const input = parseJSONAPIMonster(officialMonster);

const toUpdateInput = (monster: Monster) =>
  ({
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
  }) satisfies UpdateMonsterInput;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "monster-damage-types-"));
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

describe("monster vulnerabilities and resistances", () => {
  it("stores deduplicated values in canonical order and exposes them only when set", async () => {
    const monster = await createMonster(
      {
        ...input,
        vulnerabilities: ["radiant", "fire", "radiant"],
        resistances: ["slashing", "ice"],
      },
      "owner"
    );
    const expected = {
      vulnerabilities: ["fire", "radiant"],
      resistances: ["ice", "slashing"],
    };
    expect(await findMonster(monster.id)).toMatchObject(expected);

    const identifier = uuidToIdentifier(monster.id);
    const detail = await getMonster(
      new Request(`http://localhost/api/monsters/${identifier}`),
      { params: Promise.resolve({ id: identifier }) }
    );
    expect(detail.status).toBe(200);
    expect((await detail.json()).data.attributes).toMatchObject(expected);

    const plain = await createMonster(input, "owner");
    expect(plain).toMatchObject({ vulnerabilities: [], resistances: [] });
    const attributes = toJsonApiMonster(plain).attributes;
    expect(attributes).not.toHaveProperty("vulnerabilities");
    expect(attributes).not.toHaveProperty("resistances");
  });

  it("replaces both lists together on update and preserves them when both are omitted", async () => {
    const monster = await createMonster(
      { ...input, vulnerabilities: ["fire"], resistances: ["ice"] },
      "owner"
    );
    const updateInput = toUpdateInput(monster);
    expect(await updateMonster(updateInput, "owner")).toMatchObject({
      vulnerabilities: ["fire"],
      resistances: ["ice"],
    });
    // Moving ice from resistances to vulnerabilities must not leave it in both.
    expect(
      await updateMonster(
        { ...updateInput, vulnerabilities: ["ice", "wind"] },
        "owner"
      )
    ).toMatchObject({ vulnerabilities: ["ice", "wind"], resistances: [] });
  });

  it("imports official monsters with damage interactions", async () => {
    const monster = await upsertOfficialMonster(
      parseJSONAPIMonster({
        ...officialMonster,
        attributes: {
          ...officialMonster.attributes,
          vulnerabilities: ["radiant"],
          resistances: ["necrotic", "piercing"],
        },
      })
    );
    expect(monster).toMatchObject({
      vulnerabilities: ["radiant"],
      resistances: ["necrotic", "piercing"],
    });
  });

  it.each([
    { vulnerabilities: ["fire", "ice"], resistances: ["ice"] },
    { resistances: ["acid"] },
    { vulnerabilities: ["Fire"] },
    { vulnerabilities: "fire" },
    { resistances: null },
  ])(
    "rejects overlapping or unknown damage types at every write boundary: %j",
    async (invalid) => {
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
      expect(await getDatabase().select().from(schema.monsters)).toHaveLength(
        0
      );
    }
  );

  it("ignores damage interactions on hazards", async () => {
    const damageInteractions = {
      vulnerabilities: ["fire"],
      resistances: ["ice"],
    };
    const hazard = await createHazard(
      { ...input, ...damageInteractions },
      "owner"
    );
    const [row] = await getDatabase()
      .select()
      .from(schema.monsters)
      .where(eq(schema.monsters.id, hazard.id));
    expect(row).toMatchObject({ vulnerabilities: [], resistances: [] });
  });
});
