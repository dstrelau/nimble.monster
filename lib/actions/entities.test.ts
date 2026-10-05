import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { uuidToIdentifier } from "@/lib/utils/slug";
import { getEntityById } from "./entities";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "11111111-1111-4111-8111-111111111111", discordId: "owner" },
  })),
}));
vi.mock("@/lib/services/monsters", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/services/monsters")>();
  return {
    ...actual,
    monstersService: {
      ...actual.monstersService,
      getPublicBestiaryEntry: vi.fn(async (id: string) => ({
        id,
        name: "Pit",
        hazard: true,
      })),
    },
  };
});

vi.mock("@/lib/db/custom-rule", () => ({
  findPublicCustomRule: vi.fn(async (id: string) => ({
    id,
    name: "House Rule",
  })),
}));

describe("getEntityById", () => {
  it("uses the canonical hazard destination for monster references", async () => {
    await expect(
      getEntityById("monster", "00000000000000000000000001")
    ).resolves.toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Pit",
      type: "monster",
      href: "/hazards/pit-00000000000000000000000001",
    });
  });

  it("resolves an official rule slug", async () => {
    await expect(getEntityById("rule", "conditions")).resolves.toEqual({
      id: "conditions",
      name: "Conditions",
      type: "rule",
      href: "/rules/conditions",
    });
  });

  it("links an official variant to its section on the parent rule", async () => {
    await expect(getEntityById("rule", "playing-dead")).resolves.toEqual({
      id: "playing-dead",
      name: "Playing Dead",
      type: "rule",
      href: "/rules/conditions#variant-playing-dead",
    });
  });

  it("falls back to a public custom rule for a rule identifier", async () => {
    await expect(
      getEntityById("rule", "00000000000000000000000001")
    ).resolves.toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      name: "House Rule",
      type: "rule",
    });
  });
});

describe("entity reference visibility", () => {
  let client: Client;
  const ownerId = "11111111-1111-4111-8111-111111111111";
  const publicId = "22222222-2222-4222-8222-222222222222";
  const privateId = "33333333-3333-4333-8333-333333333333";
  const secretId = "44444444-4444-4444-8444-444444444444";

  beforeAll(async () => {
    client = createClient({ url: "file::memory:" });
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    await migrate(db, { migrationsFolder: "migrations" });
    vi.mocked(getDatabase).mockReturnValue(db);
    await db
      .insert(schema.users)
      .values({ id: ownerId, discordId: "owner", username: "owner" });
    for (const [id, visibility] of [
      [publicId, "public"],
      [privateId, "private"],
    ] as const) {
      const fields = { id, name: `${visibility} content`, visibility };
      await db
        .insert(schema.families)
        .values({ ...fields, creatorId: ownerId });
      await db
        .insert(schema.ancestries)
        .values({ ...fields, userId: ownerId, description: "Text" });
      await db
        .insert(schema.backgrounds)
        .values({ ...fields, userId: ownerId, description: "Text" });
      await db.insert(schema.adventures).values({ ...fields, userId: ownerId });
      await db
        .insert(schema.spellSchools)
        .values({ ...fields, userId: ownerId });
      await db
        .insert(schema.encounters)
        .values({ ...fields, creatorId: ownerId });
      await db
        .insert(schema.randomTables)
        .values({ ...fields, creatorId: ownerId });
    }
    await db.insert(schema.families).values({
      id: secretId,
      name: "Secret family",
      visibility: "secret",
      creatorId: ownerId,
    });
  });

  afterAll(() => {
    client.close();
  });

  it.each([
    "family",
    "ancestry",
    "background",
    "adventure",
    "school",
    "encounter",
    "table",
  ] as const)("resolves only public %s content, even for its owner", async (type) => {
    await expect(getEntityById(type, publicId)).resolves.toMatchObject({
      id: publicId,
      name: "public content",
      type,
    });
    await expect(getEntityById(type, privateId)).resolves.toBeNull();
    await expect(
      getEntityById(type, uuidToIdentifier(privateId))
    ).resolves.toBeNull();
  });

  it("rejects secret families too", async () => {
    await expect(getEntityById("family", secretId)).resolves.toBeNull();
  });
});
