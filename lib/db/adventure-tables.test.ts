import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { adventureInputSchema } from "@/app/%5Factions/_adventure/input";
import {
  type AdventureInput,
  createAdventure,
  findAdventure,
  updateAdventure,
} from "./adventures";
import { listAccessibleRandomTables } from "./random-table";
import * as schema from "./schema";

const state = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("./drizzle", () => ({ getDatabase: state.getDatabase }));

const directory = mkdtempSync(join(tmpdir(), "adventure-tables-"));
const client = createClient({ url: `file:${join(directory, "test.db")}` });
const db = drizzle(client, { schema });
const publicId = "11111111-1111-4111-8111-111111111111";
const privateId = "22222222-2222-4222-8222-222222222222";
const otherPrivateId = "33333333-3333-4333-8333-333333333333";
const weatherId = "77777777-7777-4777-8777-777777777777";
const terrainId = "88888888-8888-4888-8888-888888888888";
const foreignId = "99999999-9999-4999-8999-999999999999";

function input(
  tableId: string | null,
  visibility: "public" | "private" = "private"
): AdventureInput {
  return {
    name: "Table Adventure",
    tagline: "",
    summary: "",
    visibility,
    nodes: [
      {
        id: "root",
        parentId: null,
        kind: "section",
        orderIndex: 0,
        title: "Travel",
        content: "",
        encounterId: null,
        monsterIds: [],
        itemIds: [],
        missingStatblockCount: 0,
        presentation: null,
      },
      {
        id: "table",
        parentId: "root",
        kind: "table",
        orderIndex: 0,
        title: "",
        content: "",
        encounterId: null,
        tableId,
        monsterIds: [],
        itemIds: [],
        missingStatblockCount: 0,
        presentation: null,
      },
    ],
  };
}

beforeAll(async () => {
  state.getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await client.execute("PRAGMA foreign_keys = ON");
  await db.insert(schema.users).values([
    { id: "owner", username: "owner" },
    { id: "other", username: "other" },
  ]);
  await db.insert(schema.randomTables).values([
    {
      id: publicId,
      creatorId: "other",
      name: "Public Events",
      visibility: "public",
    },
    {
      id: privateId,
      creatorId: "owner",
      name: "Secret Events",
      visibility: "private",
    },
    {
      id: otherPrivateId,
      creatorId: "other",
      name: "Other Secrets",
      visibility: "private",
    },
  ]);
  await db.insert(schema.randomSubtables).values([
    {
      id: weatherId,
      randomTableId: publicId,
      title: "Weather",
      columns: [{ id: "result", name: "Result" }],
      orderIndex: 0,
    },
    {
      id: terrainId,
      randomTableId: publicId,
      title: "Terrain",
      columns: [{ id: "result", name: "Result" }],
      orderIndex: 1,
    },
    {
      id: foreignId,
      randomTableId: privateId,
      title: "Secrets",
      columns: [{ id: "result", name: "Result" }],
      orderIndex: 0,
    },
  ]);
  await db.insert(schema.randomSubtableRows).values({
    id: "row",
    subtableId: weatherId,
    orderIndex: 0,
    cells: { result: "Heavy rain" },
  });
});

afterAll(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("adventure reference tables", () => {
  it("parses table blocks and rejects malformed table IDs", () => {
    expect(adventureInputSchema.parse(input(publicId)).nodes[1].tableId).toBe(
      publicId
    );
    expect(adventureInputSchema.safeParse(input("not-a-uuid")).success).toBe(
      false
    );
  });

  it("lists public tables and owned private tables, but not another user's private tables", async () => {
    expect(
      (await listAccessibleRandomTables("owner")).map((table) => table.id)
    ).toEqual([publicId, privateId]);
  });

  it("persists and reloads full table contents and updates the selected table", async () => {
    const adventure = await createAdventure("owner", input(publicId, "public"));
    expect(adventure.nodes[1].table?.subtables[0].rows[0].cells).toEqual({
      result: "Heavy rain",
    });
    const updated = await updateAdventure(
      adventure.id,
      "owner",
      input(privateId)
    );
    expect(updated.nodes[1].table?.name).toBe("Secret Events");
    expect(updated.nodes[1].referenceRemoved).toBe(false);
    await expect(
      updateAdventure(adventure.id, "other", input(publicId))
    ).rejects.toThrow("Adventure not found");
  });

  it.each([
    [privateId, "public"],
    [otherPrivateId, "private"],
    ["44444444-4444-4444-8444-444444444444", "private"],
  ] satisfies Array<
    [string, "public" | "private"]
  >)("rejects unavailable table %s in a %s adventure", async (id, visibility) => {
    await expect(
      createAdventure("owner", input(id, visibility))
    ).rejects.toThrow("One or more reference tables are unavailable");
  });

  it("requires a selected table", async () => {
    await expect(createAdventure("owner", input(null))).rejects.toThrow(
      "Reference table blocks must select a table"
    );
  });

  it("prevents publishing an existing adventure with a private table", async () => {
    const adventure = await createAdventure("owner", input(privateId));
    await expect(
      updateAdventure(adventure.id, "owner", input(privateId, "public"))
    ).rejects.toThrow("One or more reference tables are unavailable");
    expect((await findAdventure(adventure.id))?.visibility).toBe("private");
  });

  it("round-trips all mode and custom IDs through rename, reorder and additions", async () => {
    const all = await createAdventure("owner", input(publicId));
    expect(all.nodes[1].subtableIds).toBeNull();
    const customInput = input(publicId);
    customInput.nodes[1].subtableIds = [weatherId];
    const custom = await createAdventure("owner", customInput);
    expect(custom.nodes[1].subtableIds).toEqual([weatherId]);
    await db
      .update(schema.randomSubtables)
      .set({ title: "Renamed Weather", orderIndex: 2 })
      .where(eq(schema.randomSubtables.id, weatherId));
    await db.insert(schema.randomSubtables).values({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      randomTableId: publicId,
      title: "New category",
      columns: [{ id: "result", name: "Result" }],
      orderIndex: 1,
    });
    const reloaded = await findAdventure(custom.id);
    expect(reloaded?.nodes[1].subtableIds).toEqual([weatherId]);
    expect(
      reloaded?.nodes[1].table?.subtables.map((subtable) => subtable.id)
    ).toEqual([terrainId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", weatherId]);
    expect(reloaded?.nodes[1].table?.subtables.at(-1)?.title).toBe(
      "Renamed Weather"
    );
    expect((await findAdventure(all.id))?.nodes[1].subtableIds).toBeNull();
    expect(
      (await updateAdventure(custom.id, "owner", input(publicId))).nodes[1]
        .subtableIds
    ).toBeNull();
  });

  it.each([
    { ids: [], message: "Select at least one sub-table" },
    {
      ids: [weatherId, weatherId],
      message: "Sub-table selections must be unique",
    },
    {
      ids: [foreignId],
      message: "One or more selected sub-tables are unavailable",
    },
    {
      ids: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
      message: "One or more selected sub-tables are unavailable",
    },
  ])("rejects invalid selections $ids without mutation", async ({
    ids,
    message,
  }) => {
    const original = await createAdventure("owner", input(publicId));
    const invalid = input(publicId);
    invalid.nodes[1].subtableIds = ids;
    // Also reference the foreign ID's table: validation must check per-block membership,
    // not just whether the sub-table belongs to any table used by this adventure.
    invalid.nodes.push({
      ...invalid.nodes[1],
      id: "other-table",
      orderIndex: 1,
      tableId: privateId,
      subtableIds: null,
    });
    await expect(
      updateAdventure(original.id, "owner", invalid)
    ).rejects.toThrow(message);
    expect(await findAdventure(original.id)).toEqual(original);
    const malformed = input(publicId);
    malformed.nodes[1].subtableIds = ["invalid-id"];
    expect(adventureInputSchema.safeParse(malformed).success).toBe(false);
  });

  it("hides a table that becomes private and preserves the block when the table is deleted", async () => {
    const adventure = await createAdventure("owner", input(publicId, "public"));
    await db
      .update(schema.randomTables)
      .set({ visibility: "private" })
      .where(eq(schema.randomTables.id, publicId));
    const hidden = await findAdventure(adventure.id);
    expect(hidden?.nodes[1].table).toBeNull();
    expect(hidden?.nodes[1].referenceRemoved).toBe(true);
    await db
      .delete(schema.randomTables)
      .where(eq(schema.randomTables.id, publicId));
    const deleted = await findAdventure(adventure.id);
    expect(deleted?.nodes).toHaveLength(2);
    expect(deleted?.nodes[1].table).toBeNull();
    expect(deleted?.nodes[1].referenceRemoved).toBe(true);
  });
});
