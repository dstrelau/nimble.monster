import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  listConditionsForMonster,
  upsertOfficialCondition,
} from "@/lib/db/condition";
import * as schema from "@/lib/db/schema";
import { ensureOfficialUser } from "@/lib/services/ensure-official-user";
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
