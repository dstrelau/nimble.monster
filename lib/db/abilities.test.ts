import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import { parseMembers } from "@/lib/services/monsters/members";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  createMonster,
  findMonsterWithCreatorId,
  updateMonster,
} from "@/lib/services/monsters/repository";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

let client: Client;
let directory: string;
const ownerId = "11111111-1111-4111-8111-111111111111";
const { monsters } = validateOfficialMonstersJSON(
  JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
);
const officialInput = parseJSONAPIMonster(monsters[0]);
const ability = { name: "Spines", description: "Melee attackers take 1d4." };
const legacyAbility = {
  ...ability,
  id: "ability",
  target: { reach: 2 },
  damage: "1d4",
  range: "2",
  area: { shape: "square", size: 3 },
  aoe: false,
  attackCount: 2,
  alternative: { name: "Spit", target: { range: 7 } },
};

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "abilities-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
  await db
    .insert(schema.users)
    .values({ id: ownerId, username: "owner", discordId: "owner" });
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

it("stores and reads only ability text while retaining structured actions", async () => {
  const members = parseMembers([
    { name: officialInput.name, abilities: [], actions: officialInput.actions },
  ]);
  members[0].abilities = [legacyAbility];
  const entry = await createMonster(
    { ...officialInput, abilities: [legacyAbility], members },
    "owner"
  );
  const stored = await client.execute({
    sql: "SELECT abilities,members,actions FROM monsters WHERE id=?",
    args: [entry.id],
  });
  expect(JSON.parse(String(stored.rows[0].abilities))).toEqual([ability]);
  expect(JSON.parse(String(stored.rows[0].members))[0].abilities).toEqual([
    ability,
  ]);

  await updateMonster(
    {
      ...entry,
      abilities: [legacyAbility],
      members,
      kind: entry.kind ?? "",
      bloodied: entry.bloodied ?? "",
      lastStand: entry.lastStand ?? "",
      saves: [],
      moreInfo: entry.moreInfo ?? "",
    },
    "owner"
  );
  const updated = await client.execute({
    sql: "SELECT abilities FROM monsters WHERE id=?",
    args: [entry.id],
  });
  expect(JSON.parse(String(updated.rows[0].abilities))).toEqual([ability]);

  // Simulate pre-migration JSON; read paths must not re-expose attack fields.
  await client.execute({
    sql: "UPDATE monsters SET abilities=? WHERE id=?",
    args: [JSON.stringify([legacyAbility]), entry.id],
  });
  const read = await findMonsterWithCreatorId(entry.id, ownerId);
  if (!read) throw new Error("Missing saved monster");
  expect(read.abilities).toEqual([{ ...ability, id: expect.any(String) }]);
  expect(toJsonApiMonster(read).attributes.abilities).toEqual([ability]);
  expect(read.actions.map(({ id, ...action }) => action)).toEqual(
    JSON.parse(String(stored.rows[0].actions))
  );
});

it("cleans legacy ability JSON in all tables and team members without changing actions", async () => {
  const entry = await createMonster(officialInput, "owner");
  const abilities = JSON.stringify([legacyAbility]);
  const actions = JSON.stringify([
    { ...officialInput.actions[0], target: { reach: 4 }, damage: "2d6" },
  ]);
  const members = [
    {
      name: "Member",
      abilities: [legacyAbility],
      actions: JSON.parse(actions),
    },
    { name: "Empty", abilities: [], actions: [] },
  ];
  await client.execute({
    sql: "UPDATE monsters SET abilities=?,actions=?,members=? WHERE id=?",
    args: [abilities, actions, JSON.stringify(members), entry.id],
  });
  await getDatabase()
    .insert(schema.families)
    .values({ name: "Family", creatorId: ownerId, abilities: [legacyAbility] });
  await getDatabase()
    .insert(schema.companions)
    .values({
      name: "Companion",
      userId: ownerId,
      kind: "Wolf",
      class: "Hunter",
      hpPerLevel: "5",
      wounds: 3,
      size: "medium",
      saves: "",
      dyingRule: "",
      abilities: [legacyAbility],
      actions: [],
    });
  const sql = readFileSync(
    "migrations/0043_abilities_without_attacks.sql",
    "utf8"
  );
  await client.executeMultiple(sql);
  for (const table of ["monsters", "families", "companions"]) {
    const result = await client.execute(`SELECT abilities FROM ${table}`);
    expect(JSON.parse(String(result.rows[0].abilities))).toEqual([
      { ...ability, id: "ability" },
    ]);
  }
  const result = await client.execute("SELECT actions,members FROM monsters");
  expect(result.rows[0].actions).toBe(actions);
  expect(JSON.parse(String(result.rows[0].members))).toEqual([
    { ...members[0], abilities: [{ ...ability, id: "ability" }] },
    members[1],
  ]);
});
