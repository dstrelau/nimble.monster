import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { ENTITY_TYPES } from "@/lib/types/entity-links";
import type { ReferenceExample } from "./fixtures";
import Page from "./page";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

describe("reference lab source data", () => {
  let client: Client;
  beforeAll(async () => {
    client = createClient({ url: "file::memory:" });
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    await migrate(db, { migrationsFolder: "migrations" });
    vi.mocked(getDatabase).mockReturnValue(db);
    const owner = "11111111-1111-4111-8111-111111111111";
    await db
      .insert(schema.users)
      .values({ id: owner, discordId: "owner", username: "owner" });
    await db.insert(schema.randomTables).values([
      {
        id: "22222222-2222-4222-8222-222222222222",
        creatorId: owner,
        name: "Public table",
        visibility: "public",
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        creatorId: owner,
        name: "Private name must not leave server",
        visibility: "private",
      },
    ]);
  });
  afterAll(() => client.close());

  it("covers every reference type and alias without leaking nonpublic names or creating records", async () => {
    const page = await Page();
    const examples: ReferenceExample[] = page.props.examples;
    expect(examples.map((example) => example.key)).toEqual([
      ...ENTITY_TYPES,
      "hazard",
      "official-rule",
      "rule-variant",
    ]);
    expect(examples.find((example) => example.key === "table")).toMatchObject({
      available: true,
      privateId: "33333333-3333-4333-8333-333333333333",
      id: "22222222-2222-4222-8222-222222222222",
      url: expect.stringMatching(
        /^https:\/\/nimble\.nexus\/tables\/public-table-[a-z0-9]{26}$/
      ),
    });
    expect(
      examples.find((example) => example.key === "companion")?.available
    ).toBe(false);
    expect(JSON.stringify(examples)).not.toContain(
      "Private name must not leave server"
    );
    expect(await getDatabase().select().from(schema.randomTables)).toHaveLength(
      2
    );
  });
});
