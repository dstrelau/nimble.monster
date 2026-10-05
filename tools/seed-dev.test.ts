import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import ReferencePage from "@/app/dev/entity-references/page";
import type { ReferenceExample } from "@/app/dev/entity-references/fixtures";
import { getEntityById } from "@/lib/actions/entities";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { seedDevData } from "./seed-dev";
import { seedOfficial } from "./seed-official";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db/client")>()),
  checkpoint: vi.fn(),
}));

describe("dev reference seed", () => {
  let client: Client;
  const directory = mkdtempSync(join(tmpdir(), "nexus-seed-test-"));
  const devId = "11111111-1111-1111-1111-111111111111";

  beforeAll(async () => {
    client = createClient({ url: `file:${join(directory, "seed.db")}` });
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    await migrate(db, { migrationsFolder: "migrations" });
    vi.mocked(getDatabase).mockReturnValue(db);
    await seedOfficial();
    await seedDevData();
  }, 30000);
  afterEach(() => vi.unstubAllEnvs());
  afterAll(() => {
    client.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("supplies public records for every preview group using official monster references", async () => {
    const page = await ReferencePage();
    const examples: ReferenceExample[] = page.props.examples;
    expect(examples).toHaveLength(17);
    expect(examples.filter((example) => !example.available)).toEqual([]);
    for (const example of examples) {
      const entity = await getEntityById(example.type, example.id);
      expect(entity, example.key).toMatchObject({ type: example.type });
      if (example.key === "hazard") {
        expect(entity).toMatchObject({
          name: "Dev's Rockfall",
          href: expect.stringMatching(/^\/hazards\//),
        });
      }
      if (example.privateId) {
        await expect(
          getEntityById(example.type, example.privateId)
        ).resolves.toBeNull();
      }
    }

    const db = getDatabase();
    const companion = await db.query.companions.findFirst();
    expect(companion).toMatchObject({
      name: "Stabs, the Somewhat Reliable",
      visibility: "public",
      userId: devId,
      hpPerLevel: "5",
    });
    expect(companion?.actions).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Stab!" })])
    );
    const encounterMonsters = await db
      .select({
        owner: schema.monsters.userId,
        quantity: schema.monstersEncounters.quantity,
      })
      .from(schema.monstersEncounters)
      .innerJoin(
        schema.monsters,
        eq(schema.monsters.id, schema.monstersEncounters.monsterId)
      );
    expect(encounterMonsters).toEqual([
      { owner: OFFICIAL_USER_ID, quantity: 4 },
    ]);
    const adventureMonsters = await db
      .select({ owner: schema.monsters.userId })
      .from(schema.adventureNodeMonsters)
      .innerJoin(
        schema.monsters,
        eq(schema.monsters.id, schema.adventureNodeMonsters.monsterId)
      );
    expect(adventureMonsters).toHaveLength(4);
    expect(
      adventureMonsters.every((monster) => monster.owner === OFFICIAL_USER_ID)
    ).toBe(true);
  });

  it("upgrades an existing database, preserves private content, and does not duplicate examples on rerun", async () => {
    const db = getDatabase();
    const companion = await db.query.companions.findFirst();
    if (!companion) throw new Error("Expected seeded companion");
    await db
      .update(schema.companions)
      .set({ visibility: "private" })
      .where(eq(schema.companions.id, companion.id));
    await expect(getEntityById("companion", companion.id)).resolves.toBeNull();
    const hazard = await db.query.monsters.findFirst({
      where: eq(schema.monsters.hazard, true),
    });
    if (!hazard) throw new Error("Expected seeded hazard");
    await db
      .update(schema.monsters)
      .set({ visibility: "private" })
      .where(eq(schema.monsters.id, hazard.id));
    await expect(getEntityById("monster", hazard.id)).resolves.toBeNull();
    await db.delete(schema.customRules);
    await db.delete(schema.adventures);
    await db.delete(schema.encounters);
    await db.delete(schema.monsters).where(eq(schema.monsters.hazard, true));

    // Dev-owned monsters already exist: the old monster guard must not skip
    // missing reference types, and a private sample is not a public sample.
    await seedDevData();
    const upgraded = await ReferencePage();
    const examples: ReferenceExample[] = upgraded.props.examples;
    expect(examples.filter((example) => !example.available)).toEqual([]);
    expect(
      await db.query.companions.findFirst({
        where: eq(schema.companions.id, companion.id),
      })
    ).toMatchObject({ visibility: "private" });
    expect(
      await db
        .select()
        .from(schema.companions)
        .where(eq(schema.companions.visibility, "public"))
    ).toHaveLength(1);

    const before = await Promise.all([
      db.select().from(schema.companions),
      db.select().from(schema.customRules),
      db.select().from(schema.encounters),
      db.select().from(schema.adventures),
      db
        .select()
        .from(schema.monsters)
        .where(
          and(
            eq(schema.monsters.userId, devId),
            eq(schema.monsters.hazard, true)
          )
        ),
    ]);
    await seedDevData();
    const after = await Promise.all([
      db.select().from(schema.companions),
      db.select().from(schema.customRules),
      db.select().from(schema.encounters),
      db.select().from(schema.adventures),
      db
        .select()
        .from(schema.monsters)
        .where(
          and(
            eq(schema.monsters.userId, devId),
            eq(schema.monsters.hazard, true)
          )
        ),
    ]);
    expect(after).toEqual(before);
  });

  it("never seeds dev content in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(getDatabase).mockClear();
    await seedDevData();
    expect(getDatabase).not.toHaveBeenCalled();
  });
});
