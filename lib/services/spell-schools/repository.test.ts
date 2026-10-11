import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { toSpellSchool } from "@/lib/db/converters";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import {
  createSpellSchool,
  findSpellSchool,
  updateSpellSchool,
} from "@/lib/db/school";
import { findSpell } from "@/lib/db/spell";
import { spellSchoolToMarkdown } from "@/lib/export/markdown";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { compareSpellSchools } from "./diff";
import {
  findOfficialSpellSchoolsByNames,
  upsertOfficialSpellSchool,
} from "./repository";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

const client = createClient({ url: "file::memory:" });
const db = drizzle(client, { schema: { ...schema, ...relations } });

beforeAll(async () => {
  vi.mocked(getDatabase).mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: OFFICIAL_USER_ID, username: "nimble-co" },
    { id: "test-user", discordId: "test-discord", username: "test" },
  ]);
});
afterAll(() => client.close());

describe("spell versions", () => {
  it("persists official legacy/current versions and exposes them through every reader", async () => {
    await upsertOfficialSpellSchool({
      name: "Ice Spells",
      spells: [
        { name: "Cryosleep", tier: 3, actions: 2, version: 2 },
        { name: "Omenrime", tier: 3, actions: 1 },
      ],
    });
    const schools = await findOfficialSpellSchoolsByNames(["Ice Spells"]);
    const school = schools.get("Ice Spells");
    if (!school) throw new Error("Missing school");
    expect(school.spells.map((s) => [s.name, s.version])).toEqual([
      ["Cryosleep", 2],
      ["Omenrime", 3],
    ]);
    const markdown = spellSchoolToMarkdown(school);
    expect(markdown).toContain(
      "### Cryosleep *(Tier 3, 2 actions, Legacy (v2))*"
    );
    expect(markdown).toContain("### Omenrime *(Tier 3, 1 action)*");
    expect(
      (await findSpellSchool(school.id))?.spells.map((s) => s.version)
    ).toEqual([2, 3]);
    expect((await findSpell(school.spells[0].id))?.version).toBe(2);
    const row = await db.query.spellSchools.findFirst({
      where: eq(schema.spellSchools.id, school.id),
      with: {
        spells: true,
        creator: true,
        source: true,
        schoolAwards: { with: { award: true } },
      },
    });
    if (!row) throw new Error("Missing relational school");
    expect(toSpellSchool(row).spells.map((s) => s.version)).toEqual([2, 3]);
    expect(
      compareSpellSchools(
        { ...school, spells: school.spells.map((s) => ({ ...s, version: 3 })) },
        school
      )
    ).toBe("updated");
    expect(
      compareSpellSchools(
        {
          ...school,
          spells: school.spells.map((s) => ({
            ...s,
            version: s.version === 3 ? undefined : s.version,
          })),
        },
        school
      )
    ).toBe("unchanged");
  });

  it("preserves legacy versions on create and edit while defaulting new spells to 3", async () => {
    const school = await createSpellSchool({
      name: "Custom Ice",
      discordId: "test-discord",
      visibility: "private",
      spells: [
        { name: "Legacy", tier: 0, actions: 1, version: 2 },
        { name: "New", tier: 1, actions: 2 },
      ],
    });
    expect(school.spells.map((s) => s.version)).toEqual([2, 3]);
    const updated = await updateSpellSchool({
      id: school.id,
      name: school.name,
      discordId: "test-discord",
      visibility: "private",
      spells: school.spells,
    });
    expect(updated.spells.map((s) => s.version)).toEqual([2, 3]);
  });

  it("backfills only removed official Core spells, not matching user spells or other schools", async () => {
    const migrationClient = createClient({ url: "file::memory:" });
    try {
      await migrationClient.executeMultiple(`
        CREATE TABLE spell_schools (id TEXT, name TEXT, user_id TEXT);
        CREATE TABLE spells (name TEXT, school_id TEXT);
        INSERT INTO spell_schools VALUES ('core', 'Ice Spells', '${OFFICIAL_USER_ID}'), ('custom', 'Ice Spells', 'test-user'), ('other', 'Other Spells', '${OFFICIAL_USER_ID}');
        INSERT INTO spells VALUES ('Cryosleep', 'core'), ('Omenrime', 'core'), ('Cryosleep', 'custom'), ('Cryosleep', 'other');
      `);
      await migrationClient.executeMultiple(
        readFileSync("migrations/0041_lush_legion.sql", "utf8")
      );
      const result = await migrationClient.execute(
        "SELECT name, school_id, version FROM spells ORDER BY school_id, name"
      );
      expect(result.rows.map((r) => [r.name, r.school_id, r.version])).toEqual([
        ["Cryosleep", "core", 2],
        ["Omenrime", "core", 3],
        ["Cryosleep", "custom", 3],
        ["Cryosleep", "other", 3],
      ]);
    } finally {
      migrationClient.close();
    }
  });
});
