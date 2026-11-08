import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  listPublicAdventuresUsingEncounter,
  listPublicAdventuresUsingRandomTable,
} from "./adventures";
import * as schema from "./schema";

const state = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("./drizzle", () => ({ getDatabase: state.getDatabase }));
const db = drizzle(createClient({ url: ":memory:" }), { schema });

const encounterId = "00000000-0000-4000-8000-000000000001";
const otherEncounterId = "00000000-0000-4000-8000-000000000002";
const tableId = "00000000-0000-4000-8000-000000000003";

beforeAll(async () => {
  state.getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db
    .insert(schema.users)
    .values({ id: "owner", username: "owner", discordId: "owner-discord" });
  await db.insert(schema.encounters).values([
    { id: encounterId, creatorId: "owner", name: "Ambush" },
    { id: otherEncounterId, creatorId: "owner", name: "Other" },
  ]);
  await db
    .insert(schema.randomTables)
    .values({ id: tableId, creatorId: "owner", name: "Loot" });
  await db.insert(schema.adventures).values([
    { id: "zeta", creatorId: "owner", name: "Zeta" },
    { id: "alpha", creatorId: "owner", name: "Alpha" },
    { id: "secret", creatorId: "owner", name: "Secret", visibility: "private" },
    { id: "unrelated", creatorId: "owner", name: "Unrelated" },
  ]);
  await db.insert(schema.adventureNodes).values([
    // Zeta uses the encounter twice and should still appear once.
    { adventureId: "zeta", kind: "encounter", orderIndex: 0, encounterId },
    { adventureId: "zeta", kind: "encounter", orderIndex: 1, encounterId },
    { adventureId: "alpha", kind: "encounter", orderIndex: 0, encounterId },
    { adventureId: "alpha", kind: "table", orderIndex: 1, tableId },
    { adventureId: "secret", kind: "encounter", orderIndex: 0, encounterId },
    { adventureId: "secret", kind: "table", orderIndex: 1, tableId },
    {
      adventureId: "unrelated",
      kind: "encounter",
      orderIndex: 0,
      encounterId: otherEncounterId,
    },
  ]);
});

describe("adventure usage", () => {
  it("lists each public adventure using an encounter once, by name", async () => {
    const adventures = await listPublicAdventuresUsingEncounter(encounterId);
    expect(adventures.map((a) => a.name)).toEqual(["Alpha", "Zeta"]);
    expect(adventures[0].creator.username).toBe("owner");
  });

  it("lists public adventures using a reference table", async () => {
    const adventures = await listPublicAdventuresUsingRandomTable(tableId);
    expect(adventures.map((a) => a.name)).toEqual(["Alpha"]);
  });
});
