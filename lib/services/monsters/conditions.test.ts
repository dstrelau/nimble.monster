import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  listConditionsForMonster,
  listLibraryConditions,
  upsertOfficialCondition,
} from "@/lib/db/condition";
import * as schema from "@/lib/db/schema";
import { ensureOfficialUser } from "@/lib/services/ensure-official-user";
import { repairMonsterConditions } from "./conditions";
import { parseMembers } from "./members";
import {
  OFFICIAL_USER_ID,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "./official";
import {
  createHazard,
  createMonster,
  updateHazard,
  updateMonster,
  upsertOfficialMonster,
} from "./repository";
import type { UpdateMonsterInput } from "./types";

const state = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: state.getDatabase }));

let client: ReturnType<typeof createClient>;
let db: ReturnType<typeof drizzle<typeof schema>>;
const references = [
  { name: "Alaric Draegoth, the Crimson Count", condition: "Beguiled" },
  { name: "Cultist", condition: "Despair" },
  { name: "Fanatic", condition: "Despair" },
  { name: "Doomsayer", condition: "Despair" },
  { name: "Ul'vek, Psionic Despot", condition: "Dominated" },
  { name: "Titan of the Deep Woods", condition: "Knockback" },
];
const official = validateOfficialMonstersJSON(
  JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
).monsters;
function monsterInput(name = "Ul'vek, Psionic Despot") {
  const data = official.find((monster) => monster.attributes.name === name);
  if (!data) throw new Error(`Missing official monster ${name}`);
  return parseJSONAPIMonster(data);
}
const linkedIds = async (id: string) =>
  (await listConditionsForMonster(id)).map((link) => link.conditionId).sort();
const allLinks = () =>
  db
    .select()
    .from(schema.monstersConditions)
    .orderBy(
      asc(schema.monstersConditions.monsterId),
      asc(schema.monstersConditions.conditionId)
    );

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  db = drizzle(client, { schema });
  state.getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await ensureOfficialUser();
  await db.insert(schema.users).values([
    { id: "owner", discordId: "owner-discord", username: "owner" },
    { id: "other", discordId: "other-discord", username: "other" },
  ]);
  for (const name of ["Dominated", "Beguiled", "Despair", "Knockback"]) {
    await upsertOfficialCondition({ name, description: `Official ${name}` });
  }
  await db.insert(schema.conditions).values([
    {
      id: "owner-dominated",
      creatorId: "owner",
      name: "DoMiNaTeD",
      description: "Owner override",
    },
    {
      id: "other-dominated",
      creatorId: "other",
      name: "dominated",
      description: "Not the owner",
    },
    {
      id: "other-only",
      creatorId: "other",
      name: "foreign only",
      description: "Not visible to the owner",
    },
  ]);
});
afterEach(() => client.close());

it("imports Title Case conditions and retains one official link per repeated reference on reimport", async () => {
  for (const { name, condition } of references) {
    const input = monsterInput(name);
    const first = await upsertOfficialMonster(input);
    const second = await upsertOfficialMonster(input);
    expect(second.id).toBe(first.id);
    expect(
      (await listConditionsForMonster(first.id)).map((link) => link.condition)
    ).toMatchObject([
      { name: condition, official: true, creatorId: OFFICIAL_USER_ID },
    ]);
  }
});

it.each(["monster", "hazard"])(
  "resolves owner overrides and official fallbacks for %s create/update, excluding other users",
  async (kind) => {
    const input = {
      ...monsterInput(),
      moreInfo: "[[dOmInAtEd|controlled]] [[DESPAIR]] [[Foreign only]]",
    };
    const entry =
      kind === "monster"
        ? await createMonster(input, "owner-discord")
        : await createHazard(input, "owner-discord");
    const despair = (await db.select().from(schema.conditions)).find(
      (condition) => condition.name === "Despair"
    );
    expect(despair).toBeDefined();
    expect(await linkedIds(entry.id)).toEqual(
      ["owner-dominated", despair?.id].sort()
    );
    const update = kind === "monster" ? updateMonster : updateHazard;
    const updateInput: UpdateMonsterInput = {
      ...input,
      id: entry.id,
      armor: input.armor === "" ? "none" : input.armor,
      legendary: input.legendary ?? false,
      minion: input.minion ?? false,
      kind: input.kind ?? "",
      saves: input.saves ?? [],
      actions: [],
      abilities: [],
      bloodied: "",
      lastStand: "",
      moreInfo: "[[bEgUiLeD|charmed]]",
    };
    await update(updateInput, "owner-discord");
    expect(
      (await listConditionsForMonster(entry.id)).map(
        (link) => link.condition.name
      )
    ).toEqual(["Beguiled"]);
    await update({ ...updateInput, moreInfo: "" }, "owner-discord");
    expect(await linkedIds(entry.id)).toEqual([]);
  }
);

it("repairs existing missing/foreign/stale links without rewriting content, supports dry runs, and is idempotent", async () => {
  for (const { name } of references)
    await upsertOfficialMonster(monsterInput(name));
  const input = monsterInput();
  const monster = await createMonster(
    {
      ...input,
      members: parseMembers([
        {
          name: "Ally",
          abilities: [{ name: "Push", description: "[[KNOCKBACK]]" }],
          actions: [],
        },
      ]),
    },
    "owner-discord"
  );
  const hazard = await createHazard(input, "owner-discord");
  await db.delete(schema.monstersConditions);
  await db.insert(schema.monstersConditions).values([
    { monsterId: monster.id, conditionId: "other-dominated", inline: false },
    { monsterId: hazard.id, conditionId: "other-only", inline: false },
  ]);
  const contentBefore = await db.select().from(schema.monsters);
  const definitionsBefore = await db.select().from(schema.conditions);
  const usageBefore = await listLibraryConditions("owner");
  const broken = await allLinks();
  expect(await repairMonsterConditions()).toEqual({
    monsters: 8,
    added: 9,
    removed: 2,
  });
  expect(await allLinks()).toEqual(broken);
  expect(await repairMonsterConditions(true)).toEqual({
    monsters: 8,
    added: 9,
    removed: 2,
  });
  expect(
    (await listConditionsForMonster(monster.id))
      .map((link) => link.condition.name)
      .sort()
  ).toEqual(["DoMiNaTeD", "Knockback"]);
  expect(await linkedIds(hazard.id)).toEqual(["owner-dominated"]);
  expect(
    (await allLinks()).some((link) => link.conditionId.startsWith("other"))
  ).toBe(false);
  expect(await db.select().from(schema.monsters)).toEqual(contentBefore);
  expect(await db.select().from(schema.conditions)).toEqual(definitionsBefore);
  expect(await listLibraryConditions("owner")).toEqual(usageBefore);
  const repaired = await allLinks();
  expect(await repairMonsterConditions(true)).toEqual({
    monsters: 8,
    added: 0,
    removed: 0,
  });
  expect(await allLinks()).toEqual(repaired);
  // A failed repair must not leave an incomplete set of links.
  await db.delete(schema.monstersConditions);
  await client.execute(`CREATE TRIGGER reject_link BEFORE INSERT ON monsters_conditions
    WHEN NEW.monster_id = '${hazard.id}' BEGIN SELECT RAISE(ABORT, 'repair failed'); END`);
  await expect(repairMonsterConditions(true)).rejects.toThrow();
  expect(await allLinks()).toEqual([]);
});
