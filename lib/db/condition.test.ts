import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import conditionJSON from "@/data/official/gmg/conditions.json";
import { validateOfficialConditionsJSON } from "@/lib/services/conditions/official";
import { ensureOfficialUser } from "@/lib/services/ensure-official-user";
import { listOfficialConditions, upsertOfficialCondition } from "./condition";
import { getDatabase } from "./drizzle";
import * as relations from "./relations";
import * as schema from "./schema";

vi.mock("./drizzle", () => ({ getDatabase: vi.fn() }));

const officialId = "00000000-0000-0000-0000-000000000000";
const description =
  "Disadvantage on all rolls (dealing or healing any damage ends).";
let client: Client;
let directory: string;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "conditions-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

it("imports official condition JSON without a data migration and is replay-safe", async () => {
  expect((await client.execute("SELECT * FROM users")).rows).toEqual([]);
  expect(await listOfficialConditions()).toEqual([]);
  await ensureOfficialUser();
  const { conditions } = validateOfficialConditionsJSON(conditionJSON);
  for (const condition of conditions) {
    await upsertOfficialCondition(condition.attributes);
  }
  expect(await listOfficialConditions()).toEqual([
    expect.objectContaining({
      name: "Despair",
      description,
      official: true,
      creatorId: officialId,
    }),
  ]);
  const once = await listOfficialConditions();
  for (const condition of conditions) {
    await upsertOfficialCondition(condition.attributes);
  }
  expect(await listOfficialConditions()).toEqual(once);
});

it("imports arbitrary conditions while preserving existing users and same-name custom conditions", async () => {
  await client.execute({
    sql: "INSERT INTO users (id, username, display_name) VALUES (?, 'custom-official', 'Existing display name')",
    args: [officialId],
  });
  await client.execute(
    "INSERT INTO users (id, username) VALUES ('owner', 'owner')"
  );
  await client.execute(`INSERT INTO conditions
    (id, name, description, official, creator_id) VALUES
    ('custom', 'Marked', 'My custom condition.', 0, 'owner'),
    ('existing', 'Prone', 'Existing official text.', 1, 'owner')`);
  const before = await client.execute("SELECT * FROM conditions ORDER BY id");
  const usersBefore = await client.execute("SELECT * FROM users ORDER BY id");
  const imported = await upsertOfficialCondition({
    name: "Marked",
    description: "Attacks against you have advantage.",
  });
  const once = await client.execute("SELECT * FROM conditions ORDER BY id");
  await upsertOfficialCondition({
    name: "Marked",
    description: "Attacks against you have advantage.",
  });
  expect(
    (await client.execute("SELECT * FROM users ORDER BY id")).rows
  ).toEqual(usersBefore.rows);
  expect(
    (await client.execute("SELECT * FROM conditions ORDER BY id")).rows
  ).toEqual(once.rows);
  expect(once.rows.filter((row) => row.id !== imported.id)).toEqual(
    before.rows
  );
  expect(await listOfficialConditions()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "Marked",
        description: "Attacks against you have advantage.",
        creatorId: officialId,
      }),
      expect.objectContaining({
        id: "existing",
        description: "Existing official text.",
      }),
    ])
  );
  expect(await listOfficialConditions()).toHaveLength(2);
});

it("updates official conditions case-insensitively without replacing their identity or ownership", async () => {
  await ensureOfficialUser();
  await client.execute(
    "INSERT INTO users (id, username) VALUES ('legacy-owner', 'legacy-owner')"
  );
  await client.execute(`INSERT INTO conditions (id, name, description, official, creator_id)
    VALUES ('existing-despair', 'despair', 'Outdated definition.', 1, 'legacy-owner')`);
  const { conditions } = validateOfficialConditionsJSON(conditionJSON);
  for (const condition of conditions) {
    await upsertOfficialCondition(condition.attributes);
  }
  expect(await listOfficialConditions()).toEqual([
    expect.objectContaining({
      id: "existing-despair",
      name: "Despair",
      description,
      creatorId: "legacy-owner",
    }),
  ]);
});

it.each([
  { data: [] },
  {
    data: [
      { type: "monsters", attributes: { name: "Wrong", description: "Wrong" } },
    ],
  },
  { data: [{ type: "conditions", attributes: null }] },
  {
    data: [
      {
        type: "conditions",
        attributes: { name: " ", description: "Empty name" },
      },
    ],
  },
  {
    data: [{ type: "conditions", attributes: { name: "Missing description" } }],
  },
  {
    data: [
      {
        type: "conditions",
        attributes: { name: "Despair", description: "First" },
      },
      {
        type: "conditions",
        attributes: { name: "despair", description: "Duplicate" },
      },
    ],
  },
])("rejects invalid official condition content: %j", (json) => {
  expect(() => validateOfficialConditionsJSON(json)).toThrow();
});
