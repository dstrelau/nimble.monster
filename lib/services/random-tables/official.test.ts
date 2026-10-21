import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import equipmentTables from "@/data/official/core/equipment-tables.json";
import { getDatabase } from "@/lib/db/drizzle";
import {
  createRandomTable,
  getPublicRandomTableById,
  getRandomTable,
  listRandomTablesForUser,
  updateRandomTable,
  upsertOfficialRandomTable,
} from "@/lib/db/random-table";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { findOrCreateSource } from "@/lib/db/source";
import { ensureOfficialUser } from "@/lib/services/ensure-official-user";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { validateOfficialRandomTablesJSON } from "./official";
import { searchPublicRandomTables } from "./repository";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

const { tables, source } = validateOfficialRandomTablesJSON(equipmentTables);

function tableContent(table: (typeof tables)[number]) {
  return {
    name: table.name,
    description: table.description,
    visibility: table.visibility,
    subtables: table.subtables.map(({ title, columns, rows }) => ({
      title,
      columns,
      rows,
    })),
  };
}

describe("official equipment JSON", () => {
  it("preserves all PDF categories, rows, and representative nontrivial values", () => {
    expect(source).toEqual({
      name: "Core Rules 3.0",
      abbreviation: "Core3",
      license: "Nimble 3rd Party Creator License v2.0",
      link: "https://nimblerpg.com/",
    });
    expect(tables.map((table) => table.name)).toEqual([
      "Armor & Defense",
      "Weapons",
      "Misc Adventuring Equipment",
    ]);
    expect(
      tables.flatMap((table) =>
        table.subtables.map((subtable) => [
          subtable.title,
          subtable.rows.length,
        ])
      )
    ).toEqual([
      ["Cloth", 4],
      ["Leather", 4],
      ["Mail", 4],
      ["Plate", 4],
      ["Shields", 4],
      ["Melee Weapons", 16],
      ["Ranged Weapons", 7],
      ["Misc Adventuring Equipment", 34],
    ]);
    expect(tables[0].subtables[2].rows[3].cells).toEqual({
      item: "Dragonscale (Req. 4 STR)",
      defense: "15+DEX (max 2)",
      cost: "3,000 gp",
    });
    expect(tables[1].subtables[1].rows[6].cells).toEqual({
      item: "Handheld Ballista",
      damage: "1d20+DEX piercing",
      properties: "2-handed, Load: 2 actions, Range 8 (Req. 2 STR)",
      cost: "120 gp",
    });
    expect(tables[2].subtables[0].rows[32].cells).toEqual({
      item: "Instrument",
      properties: "Drums, Horn, Lyre, Flute, etc.",
      cost: "5–50 gp",
    });
    expect(tables[2].subtables[0].rows[33].cells.cost).toBe("5 sp");
    for (const table of tables) {
      expect(table.visibility).toBe("public");
      for (const subtable of table.subtables) {
        for (const row of subtable.rows) {
          expect(Object.keys(row.cells)).toEqual(
            subtable.columns.map((column) => column.id)
          );
        }
      }
    }
  });

  it.each([
    null,
    { data: [] },
    { data: [{ ...equipmentTables.data[0], id: undefined }] },
    { data: [equipmentTables.data[0], equipmentTables.data[0]] },
    {
      data: [
        {
          ...equipmentTables.data[0],
          attributes: {
            ...equipmentTables.data[0].attributes,
            subtables: [{ ...tables[0].subtables[0], id: undefined }],
          },
        },
      ],
    },
    {
      data: [
        {
          ...equipmentTables.data[0],
          attributes: {
            ...equipmentTables.data[0].attributes,
            subtables: [tables[0].subtables[0], tables[0].subtables[0]],
          },
        },
      ],
    },
    { ...equipmentTables, source: { name: "Incomplete source" } },
    { data: [{ type: "items", attributes: tables[0] }] },
    {
      data: [
        equipmentTables.data[0],
        { type: "random-tables", attributes: { ...tables[1], subtables: [] } },
      ],
    },
  ])("rejects malformed document %# before loading", (json) => {
    expect(() => validateOfficialRandomTablesJSON(json)).toThrow();
  });
});

describe("official table persistence", () => {
  let client: Client;
  let directory: string;

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "equipment-tables-"));
    client = createClient({ url: `file:${join(directory, "test.db")}` });
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    await migrate(db, { migrationsFolder: "migrations" });
    vi.mocked(getDatabase).mockReturnValue(db);
    await ensureOfficialUser();
  });

  afterEach(() => {
    client.close();
    rmSync(directory, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("loads the seed twice without duplicates and round-trips every cell in order", async () => {
    for (const table of tables) await upsertOfficialRandomTable(table);
    const firstRows = await getDatabase().select().from(schema.randomTables);
    const firstSubtables = await getDatabase()
      .select()
      .from(schema.randomSubtables);
    if (!source) throw new Error("Missing seed source");
    for (let pass = 0; pass < 2; pass++) {
      const sourceId = await findOrCreateSource(source);
      for (const table of tables)
        await upsertOfficialRandomTable({ ...table, sourceId });
    }
    expect(await getDatabase().select().from(schema.sources)).toHaveLength(1);
    const secondRows = await getDatabase().select().from(schema.randomTables);
    expect(secondRows.map((row) => row.id)).toEqual(
      firstRows.map((row) => row.id)
    );
    expect(secondRows).toHaveLength(3);
    expect(await getDatabase().select().from(schema.randomSubtables)).toEqual(
      firstSubtables
    );
    expect(firstSubtables).toHaveLength(8);
    expect(
      await getDatabase().select().from(schema.randomSubtableRows)
    ).toHaveLength(77);

    for (const table of tables) {
      const row = secondRows.find((row) => row.name === table.name);
      expect(row).toBeDefined();
      if (!row) throw new Error("Missing seeded table");
      const loaded = await getPublicRandomTableById(row.id);
      expect(loaded).toMatchObject({
        ...tableContent(table),
        source: { name: "Core Rules 3.0", abbreviation: "Core3" },
        creator: { id: OFFICIAL_USER_ID, username: "nimble-co" },
      });
      expect(loaded?.source?.createdAt).toBeInstanceOf(Date);
      expect(loaded?.subtables).toHaveLength(table.subtables.length);
      expect(loaded?.subtables.map((subtable) => subtable.rows.length)).toEqual(
        table.subtables.map((subtable) => subtable.rows.length)
      );
    }
    const results = await searchPublicRandomTables({
      sortBy: "name",
      sortDirection: "asc",
      limit: 10,
    });
    expect(results.map((table) => table.name)).toEqual([
      "Armor & Defense",
      "Misc Adventuring Equipment",
      "Weapons",
    ]);
    for (const table of results) {
      expect(table.source).toMatchObject({
        name: "Core Rules 3.0",
        abbreviation: "Core3",
      });
    }
  });

  it("loads owned sources, preserves them on edit, and keeps unsourced tables", async () => {
    if (!source) throw new Error("Missing seed source");
    const sourceId = await findOrCreateSource(source);
    await getDatabase().insert(schema.users).values({
      id: "source-test-owner",
      discordId: "source-test-discord",
      username: "source-test-owner",
    });
    const input = {
      ...tableContent(tables[1]),
      discordId: "source-test-discord",
      visibility: "private" as const,
    };
    const created = await createRandomTable(input);
    expect(created.source).toBeUndefined();
    await getDatabase()
      .update(schema.randomTables)
      .set({ sourceId })
      .where(eq(schema.randomTables.id, created.id));
    expect(
      (await getRandomTable(created.id, input.discordId))?.source
    ).toMatchObject(source);
    expect(await getPublicRandomTableById(created.id)).toBeNull();
    expect(
      (await listRandomTablesForUser(input.discordId))[0].source
    ).toMatchObject(source);
    const updated = await updateRandomTable({
      ...input,
      id: created.id,
      subtables: created.subtables,
      name: "Edited weapons",
    });
    expect(updated.source).toMatchObject(source);
    await upsertOfficialRandomTable(tables[0]);
    const unsourced = await searchPublicRandomTables({
      sortBy: "name",
      sortDirection: "asc",
      limit: 10,
    });
    expect(unsourced).toHaveLength(1);
    expect(unsourced[0].source).toBeUndefined();
    await getDatabase()
      .delete(schema.sources)
      .where(eq(schema.sources.id, sourceId));
    expect(
      (await getRandomTable(created.id, input.discordId))?.source
    ).toBeUndefined();
  });

  it("replaces obsolete rows and subtables without touching a user's same-name table", async () => {
    const db = getDatabase();
    await db.insert(schema.users).values({ id: "user-1", username: "owner" });
    await db.insert(schema.randomTables).values({
      id: "user-table",
      name: tables[0].name,
      creatorId: "user-1",
      description: "User content",
      visibility: "private",
    });
    await upsertOfficialRandomTable(tables[0]);
    const revised = {
      ...tables[0],
      description: "Revised description",
      subtables: [
        {
          ...tables[0].subtables[2],
          rows: [
            { cells: { item: "Revised mail", defense: "7", cost: "11 gp" } },
          ],
        },
      ],
    };
    await upsertOfficialRandomTable(revised);

    const [official] = await db
      .select()
      .from(schema.randomTables)
      .where(eq(schema.randomTables.creatorId, OFFICIAL_USER_ID));
    expect(await getPublicRandomTableById(official.id)).toMatchObject(
      tableContent(revised)
    );
    expect(await db.select().from(schema.randomSubtables)).toHaveLength(1);
    expect(await db.select().from(schema.randomSubtableRows)).toHaveLength(1);
    const [owned] = await db
      .select()
      .from(schema.randomTables)
      .where(eq(schema.randomTables.id, "user-table"));
    expect(owned).toMatchObject({
      creatorId: "user-1",
      description: "User content",
      visibility: "private",
    });
  });

  it("rolls back the parent and replaced subtables if a row insert fails", async () => {
    await upsertOfficialRandomTable(tables[0]);
    const [row] = await getDatabase().select().from(schema.randomTables);
    const original = await getPublicRandomTableById(row.id);
    await client.execute(`CREATE TRIGGER fail_table_rows
      BEFORE INSERT ON random_subtable_rows
      BEGIN SELECT RAISE(ABORT, 'row insert failed'); END`);

    await expect(
      upsertOfficialRandomTable({ ...tables[0], description: "Must roll back" })
    ).rejects.toThrow();
    expect(await getPublicRandomTableById(row.id)).toEqual(original);
  });

  it("keeps user sub-table IDs across rename, reorder, row edits, additions and deletion", async () => {
    await getDatabase().insert(schema.users).values({
      id: "owner",
      username: "owner",
      discordId: "owner-discord",
    });
    const input = { ...tableContent(tables[0]), discordId: "owner-discord" };
    const created = await createRandomTable(input);
    const updated = await updateRandomTable({
      ...input,
      id: created.id,
      name: "Renamed parent",
      subtables: [
        {
          ...created.subtables[3],
          title: "Renamed plate",
          rows: [{ cells: { item: "Edited", defense: "12", cost: "9 gp" } }],
        },
        created.subtables[0],
        { ...input.subtables[1], title: "New leather" },
      ],
    });
    expect(updated.subtables.map((subtable) => subtable.id)).toEqual([
      created.subtables[3].id,
      created.subtables[0].id,
      expect.any(String),
    ]);
    expect(created.subtables.map((subtable) => subtable.id)).not.toContain(
      updated.subtables[2].id
    );
    expect(updated.subtables[0]).toMatchObject({
      title: "Renamed plate",
      rows: [{ cells: { item: "Edited", defense: "12", cost: "9 gp" } }],
    });
    const records = await getDatabase().select().from(schema.randomSubtables);
    expect(records.map((row) => row.id).sort()).toEqual(
      updated.subtables.map((row) => row.id).sort()
    );
    expect(records.every((row) => row.officialId === null)).toBe(true);
    expect(
      await getDatabase().select().from(schema.randomSubtableRows)
    ).toHaveLength(9);
    const savedAgain = await updateRandomTable({
      ...input,
      id: created.id,
      subtables: updated.subtables,
    });
    expect(savedAgain.subtables.map((row) => row.id)).toEqual(
      updated.subtables.map((row) => row.id)
    );
  });

  it("rejects duplicate, unknown, foreign sub-table IDs and unauthorized edits without mutation", async () => {
    await getDatabase()
      .insert(schema.users)
      .values([
        { id: "owner", username: "owner", discordId: "owner-discord" },
        { id: "other", username: "other", discordId: "other-discord" },
      ]);
    const input = { ...tableContent(tables[1]), discordId: "owner-discord" };
    const created = await createRandomTable(input);
    const other = await createRandomTable({
      ...input,
      discordId: "other-discord",
    });
    // A different table owned by the same user is still foreign.
    const sibling = await createRandomTable(input);
    for (const subtables of [
      [created.subtables[0], created.subtables[0]],
      [{ ...created.subtables[0], id: "fe092006-022a-4285-bdd4-6e0ff3b489ad" }],
      [other.subtables[0]],
      [sibling.subtables[0]],
    ]) {
      await expect(
        updateRandomTable({
          ...input,
          id: created.id,
          name: "Must roll back",
          subtables,
        })
      ).rejects.toThrow(/Sub-table/);
      expect(await getRandomTable(created.id, input.discordId)).toEqual(
        created
      );
    }
    await expect(
      updateRandomTable({
        ...input,
        id: created.id,
        discordId: "other-discord",
        subtables: created.subtables,
      })
    ).rejects.toThrow("Random table not found");
    const before = await getDatabase().select().from(schema.randomTables);
    await expect(
      createRandomTable({ ...input, subtables: created.subtables })
    ).rejects.toThrow("Sub-table ID does not belong");
    expect(await getDatabase().select().from(schema.randomTables)).toEqual(
      before
    );
    expect(await getRandomTable(other.id, "other-discord")).toEqual(other);
  });

  it("maps legacy seed titles once, retaining existing IDs through reordered and renamed imports", async () => {
    const original = tables[0];
    const parentId = crypto.randomUUID();
    await getDatabase().insert(schema.randomTables).values({
      id: parentId,
      name: original.name,
      creatorId: OFFICIAL_USER_ID,
    });
    const legacyRows = original.subtables.map((subtable, index) => ({
      id: crypto.randomUUID(),
      randomTableId: parentId,
      title: subtable.title,
      columns: subtable.columns,
      orderIndex: original.subtables.length - index,
    }));
    await getDatabase().insert(schema.randomSubtables).values(legacyRows);
    const revised = {
      ...original,
      name: "Renamed armor",
      subtables: [...original.subtables].reverse().map((subtable) => ({
        ...subtable,
        title: `Renamed ${subtable.title}`,
      })),
    };
    await upsertOfficialRandomTable(revised);
    const mapped = await getDatabase().select().from(schema.randomSubtables);
    expect(mapped.map((row) => row.id).sort()).toEqual(
      legacyRows.map((row) => row.id).sort()
    );
    for (const subtable of original.subtables) {
      expect(mapped.find((row) => row.officialId === subtable.id)?.id).toBe(
        legacyRows.find((row) => row.title === subtable.title)?.id
      );
    }
    const loaded = await getPublicRandomTableById(parentId);
    expect(loaded).toMatchObject(tableContent(revised));
    expect(loaded?.subtables.map((row) => row.id)).toEqual(
      [...legacyRows].reverse().map((row) => row.id)
    );
    // Subsequent imports no longer depend on the historical names.
    await upsertOfficialRandomTable({
      ...revised,
      legacyName: undefined,
      subtables: revised.subtables.map((subtable) => ({
        ...subtable,
        legacyTitle: undefined,
      })),
    });
    expect(await getPublicRandomTableById(parentId)).toMatchObject(
      tableContent(revised)
    );
    expect(await getDatabase().select().from(schema.randomSubtables)).toEqual(
      mapped
    );
    expect(await getDatabase().select().from(schema.randomTables)).toHaveLength(
      1
    );
  });

  it.each([
    "duplicate title",
    "unmapped title",
    "duplicate parent",
  ])("rejects %s during legacy mapping without mutation", async (problem) => {
    const parentId = crypto.randomUUID();
    await getDatabase().insert(schema.randomTables).values({
      id: parentId,
      name: tables[0].name,
      creatorId: OFFICIAL_USER_ID,
    });
    await getDatabase()
      .insert(schema.randomSubtables)
      .values({
        id: crypto.randomUUID(),
        randomTableId: parentId,
        title:
          problem === "unmapped title" ? "Unknown historical title" : "Cloth",
        columns: tables[0].subtables[0].columns,
        orderIndex: 0,
      });
    if (problem === "duplicate title") {
      await getDatabase().insert(schema.randomSubtables).values({
        id: crypto.randomUUID(),
        randomTableId: parentId,
        title: "Cloth",
        columns: tables[0].subtables[0].columns,
        orderIndex: 1,
      });
    }
    if (problem === "duplicate parent") {
      await getDatabase().insert(schema.randomTables).values({
        id: crypto.randomUUID(),
        name: tables[0].name,
        creatorId: OFFICIAL_USER_ID,
      });
    }
    const before = await getPublicRandomTableById(parentId);
    await expect(upsertOfficialRandomTable(tables[0])).rejects.toThrow(
      /legacy/i
    );
    expect(await getPublicRandomTableById(parentId)).toEqual(before);
    expect(
      (await getDatabase().select().from(schema.randomTables)).every(
        (row) => row.officialId === null
      )
    ).toBe(true);
  });

  it("rejects official import keys attached to another table", async () => {
    await upsertOfficialRandomTable(tables[0]);
    const before = await getDatabase().select().from(schema.randomTables);
    await expect(
      upsertOfficialRandomTable({
        ...tables[1],
        subtables: [tables[0].subtables[0]],
      })
    ).rejects.toThrow("Official sub-table ID belongs to another table");
    expect(await getDatabase().select().from(schema.randomTables)).toEqual(
      before
    );
  });
});
