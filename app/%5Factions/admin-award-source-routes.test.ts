import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { auth, getDatabase, revalidatePath } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { POST as addAwardAssociation } from "./addAwardAssociation/route";
import { POST as createSource } from "./createSource/route";
import { POST as deleteAward } from "./deleteAward/route";
import { POST as deleteSource } from "./deleteSource/route";
import { POST as removeAwardAssociation } from "./removeAwardAssociation/route";
import { POST as updateAward } from "./updateAward/route";
import { POST as updateSource } from "./updateSource/route";

const client = createClient({ url: "file::memory:" });
const db = drizzle(client, { schema });
const rows = async (sql: string) => (await client.execute(sql)).rows;
const request = (path: string, body: unknown, headers = {}) =>
  new Request(`https://example.com/_actions/${path}`, {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

// One entity per award-able type, each with a distinct id so a wrong
// type-to-table mapping cannot accidentally hit the right row.
const entities = {
  monster: ["monsters_awards", "monster_id", "m-1"],
  item: ["items_awards", "item_id", "i-1"],
  companion: ["companions_awards", "companion_id", "c-1"],
  subclass: ["subclasses_awards", "subclass_id", "sc-1"],
  school: ["spell_schools_awards", "school_id", "ss-1"],
  ancestry: ["ancestries_awards", "ancestry_id", "an-1"],
  background: ["backgrounds_awards", "background_id", "bg-1"],
} as const;
const award = {
  name: "Original",
  abbreviation: "OG 1",
  description: "",
  url: "https://example.com/og",
  color: "blue",
  icon: "award",
};

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "migrations" });
  await client.executeMultiple(`
    INSERT INTO users (id, username) VALUES ('u', 'u');
    INSERT INTO monsters (id, user_id, name, level, hp, armor) VALUES ('m-1', 'u', 'M', '1', 1, 'none');
    INSERT INTO items (id, name, user_id) VALUES ('i-1', 'I', 'u');
    INSERT INTO companions (id, name, hp_per_level, user_id) VALUES ('c-1', 'C', '1', 'u');
    INSERT INTO subclasses (id, name, class_name, user_id) VALUES ('sc-1', 'S', 'Mage', 'u');
    INSERT INTO spell_schools (id, name, user_id) VALUES ('ss-1', 'SS', 'u');
    INSERT INTO ancestries (id, name, description, user_id) VALUES ('an-1', 'A', 'd', 'u');
    INSERT INTO backgrounds (id, name, description, user_id) VALUES ('bg-1', 'B', 'd', 'u');
  `);
});
beforeEach(async () => {
  vi.clearAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "qa-admin", role: "admin" } });
  await client.executeMultiple(`
    DELETE FROM awards;
    UPDATE monsters SET source_id = NULL;
    DELETE FROM sources;
    INSERT INTO awards (id, name, abbreviation, description, slug, url, color, icon)
      VALUES ('a-1', 'Original', 'OG 1', '', 'og-1', 'https://example.com/og', 'blue', 'award'),
             ('a-2', 'Other', 'TAKEN', '', 'taken', 'https://example.com/t', 'red', 'award');
    INSERT INTO sources (id, name, abbreviation, license, link)
      VALUES ('s-1', 'Core', 'CR', 'CC', 'https://example.com/core'),
             ('s-used', 'Used', 'U', 'CC', 'https://example.com/used');
    UPDATE monsters SET source_id = 's-used';
  `);
});
afterAll(() => client.close());

it("updates exactly the addressed award and re-derives its slug", async () => {
  const response = await updateAward(
    request("updateAward", {
      ...award,
      id: "a-1",
      name: "Renamed 雪",
      abbreviation: "New & 2",
      slug: "forged",
    })
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true });
  expect(await rows("SELECT id, name, slug FROM awards ORDER BY id")).toEqual([
    expect.objectContaining({ id: "a-1", name: "Renamed 雪", slug: "new-2" }),
    expect.objectContaining({ id: "a-2", name: "Other", slug: "taken" }),
  ]);
  expect(revalidatePath).toHaveBeenCalledWith("/admin/awards");
});

it("rejects award updates that conflict, miss, or are not from an admin", async () => {
  const before = await rows("SELECT * FROM awards ORDER BY id");
  const conflict = await updateAward(
    request("updateAward", { ...award, id: "a-1", abbreviation: "Taken" })
  );
  expect(conflict.status).toBe(409);
  expect(await conflict.json()).toEqual({
    error: "An award with this abbreviation already exists",
  });
  expect(
    (await updateAward(request("updateAward", { ...award, id: "missing" })))
      .status
  ).toBe(404);
  for (const [session, status] of [
    [null, 401],
    [{ user: { id: "user", role: null } }, 403],
  ] as const) {
    auth.mockResolvedValue(session);
    expect(
      (await updateAward(request("updateAward", { ...award, id: "a-1" })))
        .status
    ).toBe(status);
  }
  expect(await rows("SELECT * FROM awards ORDER BY id")).toEqual(before);
});

it("deletes one award, cascading its associations, then reports 404", async () => {
  await client.execute(
    "INSERT INTO monsters_awards (monster_id, award_id) VALUES ('m-1', 'a-1'), ('m-1', 'a-2')"
  );
  expect(
    (await deleteAward(request("deleteAward", { id: "a-1" }))).status
  ).toBe(200);
  expect(await rows("SELECT id FROM awards")).toEqual([{ id: "a-2" }]);
  expect(await rows("SELECT award_id FROM monsters_awards")).toEqual([
    { award_id: "a-2" },
  ]);
  const again = await deleteAward(request("deleteAward", { id: "a-1" }));
  expect(again.status).toBe(404);
});

it("adds and removes associations in the table for each entity type", async () => {
  for (const [entityType, [table, column, entityId]] of Object.entries(
    entities
  )) {
    const body = { entityType, entityId, awardId: "a-2" };
    for (let i = 0; i < 2; i++) {
      const added = await addAwardAssociation(
        request("addAwardAssociation", body)
      );
      expect(added.status).toBe(200);
    }
    expect(await rows(`SELECT ${column}, award_id FROM ${table}`)).toEqual([
      { [column]: entityId, award_id: "a-2" },
    ]);
    const removed = await removeAwardAssociation(
      request("removeAwardAssociation", body)
    );
    expect(removed.status).toBe(200);
    expect(await rows(`SELECT * FROM ${table}`)).toEqual([]);
  }
});

it("rejects associations to unknown awards, entities, or entity types", async () => {
  for (const [body, status] of [
    [{ entityType: "monster", entityId: "m-1", awardId: "missing" }, 404],
    [{ entityType: "item", entityId: "m-1", awardId: "a-1" }, 404],
    [{ entityType: "user", entityId: "u", awardId: "a-1" }, 400],
  ] as const) {
    expect(
      (await addAwardAssociation(request("addAwardAssociation", body))).status
    ).toBe(status);
  }
  expect(await rows("SELECT * FROM monsters_awards")).toEqual([]);
  expect(await rows("SELECT * FROM items_awards")).toEqual([]);
});

it("creates, updates, and deletes sources; in-use sources are kept", async () => {
  const source = {
    name: "Second",
    abbreviation: "S2",
    license: "OGL",
    link: "https://example.com/s2",
  };
  expect((await createSource(request("createSource", source))).status).toBe(
    200
  );
  expect(
    (
      await updateSource(
        request("updateSource", { ...source, id: "s-1", name: "Core v2" })
      )
    ).status
  ).toBe(200);
  expect(
    (await updateSource(request("updateSource", { ...source, id: "missing" })))
      .status
  ).toBe(404);
  const inUse = await deleteSource(request("deleteSource", { id: "s-used" }));
  expect(inUse.status).toBe(409);
  expect(await inUse.json()).toEqual({
    error: "This source is still used by content",
  });
  expect(
    (await deleteSource(request("deleteSource", { id: "s-1" }))).status
  ).toBe(200);
  expect(
    (await deleteSource(request("deleteSource", { id: "s-1" }))).status
  ).toBe(404);
  expect(await rows("SELECT name FROM sources ORDER BY name")).toEqual([
    { name: "Second" },
    { name: "Used" },
  ]);
  expect(revalidatePath).toHaveBeenCalledWith("/admin/sources");
});

it("rejects non-admin, cross-origin, non-JSON, and invalid source writes", async () => {
  const before = await rows("SELECT * FROM sources ORDER BY id");
  const valid = {
    name: "N",
    abbreviation: "N",
    license: "L",
    link: "https://example.com",
  };
  for (const [body, headers, status] of [
    [valid, { Origin: "https://evil.example" }, 403],
    [valid, { "Content-Type": "text/plain" }, 415],
    ["{", {}, 400],
    [{ ...valid, link: "not-a-url" }, {}, 400],
    [{ ...valid, name: "" }, {}, 400],
  ] as const) {
    expect(
      (await createSource(request("createSource", body, headers))).status
    ).toBe(status);
  }
  auth.mockResolvedValue({ user: { id: "user", role: "user" } });
  expect((await createSource(request("createSource", valid))).status).toBe(403);
  expect(
    (await deleteSource(request("deleteSource", { id: "s-1" }))).status
  ).toBe(403);
  expect(await rows("SELECT * FROM sources ORDER BY id")).toEqual(before);
});
