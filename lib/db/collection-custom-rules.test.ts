import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import {
  createCollection,
  getCollection,
  getPublicCollectionByIdWithMonstersItems,
  updateCollection,
} from "./collection";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

let client: Client;
let directory: string;
const ownerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const ruleIds = {
  pub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownPrivate: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  foreignPrivate: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "collection-rules-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
  await db.insert(schema.users).values([
    { id: ownerId, username: "owner", discordId: "owner" },
    { id: otherId, username: "other", discordId: "other" },
  ]);
  await db.insert(schema.customRules).values([
    { id: ruleIds.pub, userId: otherId, name: "Pub", visibility: "public" },
    {
      id: ruleIds.ownPrivate,
      userId: ownerId,
      name: "Mine",
      visibility: "private",
    },
    {
      id: ruleIds.foreignPrivate,
      userId: otherId,
      name: "Theirs",
      visibility: "private",
    },
  ]);
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("collection custom rules", () => {
  it("links accessible rules only and hides private ones from public views", async () => {
    const created = await createCollection({
      name: "C",
      visibility: "public",
      discordId: "owner",
    });
    await updateCollection({
      id: created.id,
      name: "C",
      visibility: "public",
      discordId: "owner",
      customRuleIds: Object.values(ruleIds),
    });

    const owned = await getCollection(created.id, "owner");
    expect(owned?.customRules.map((r) => r.name).sort()).toEqual([
      "Mine",
      "Pub",
    ]);

    const publicView = await getPublicCollectionByIdWithMonstersItems(
      created.id
    );
    expect(publicView?.customRules.map((r) => r.name)).toEqual(["Pub"]);

    // A linked rule that its author later makes private disappears for the
    // collection owner too.
    await getDatabase()
      .update(schema.customRules)
      .set({ visibility: "private" })
      .where(eq(schema.customRules.id, ruleIds.pub));
    expect(
      (await getCollection(created.id, "owner"))?.customRules.map((r) => r.name)
    ).toEqual(["Mine"]);

    await updateCollection({
      id: created.id,
      name: "C",
      visibility: "public",
      discordId: "owner",
      customRuleIds: [],
    });
    expect((await getCollection(created.id, "owner"))?.customRules).toEqual([]);
  });
});
