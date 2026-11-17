import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: mocks.getDatabase }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  getMonsteryMondayOverview,
  listFeaturedCollections,
  MONSTERY_MONDAY,
} from "@/lib/services/collections/queries";
import { POST } from "./route";

const db = drizzle(createClient({ url: ":memory:" }), { schema });

function request(body: unknown, origin = "https://nimble.nexus") {
  return new Request("https://nimble.nexus/_actions/updateFeaturedCollection", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  mocks.getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values({ id: "u", username: "curator" });
  await db.insert(schema.collections).values([
    { id: "week", creatorId: "u", name: "A new theme" },
    {
      id: "other",
      creatorId: "u",
      name: "Another feature",
      featuredCollection: "another feature",
    },
  ]);
});

beforeEach(() => {
  mocks.isAdmin.mockResolvedValue(true);
});

it("adds and removes a collection from the Monstery Monday page", async () => {
  const add = await POST(request({ collectionId: "week", featured: true }));
  expect(add.status).toBe(200);
  expect(
    (await listFeaturedCollections(MONSTERY_MONDAY)).map((c) => c.id)
  ).toEqual(["week"]);
  expect(await getMonsteryMondayOverview()).toMatchObject({
    collections: 1,
    latest: { id: "week" },
  });

  const remove = await POST(request({ collectionId: "week", featured: false }));
  expect(remove.status).toBe(200);
  expect(await listFeaturedCollections(MONSTERY_MONDAY)).toEqual([]);
  expect(await getMonsteryMondayOverview()).toMatchObject({
    collections: 0,
    latest: null,
  });
});

it("never overwrites or clears another group's tag", async () => {
  for (const featured of [true, false]) {
    const response = await POST(request({ collectionId: "other", featured }));
    expect(response.status).toBe(409);
  }
  expect(
    (await listFeaturedCollections("another feature")).map((c) => c.id)
  ).toEqual(["other"]);
  expect(await listFeaturedCollections(MONSTERY_MONDAY)).toEqual([]);
});

it("denies non-admins and cross-origin writes, and rejects bad input", async () => {
  mocks.isAdmin.mockResolvedValue(false);
  expect(
    (await POST(request({ collectionId: "week", featured: true }))).status
  ).toBe(403);
  mocks.isAdmin.mockResolvedValue(true);
  expect(
    (
      await POST(
        request(
          { collectionId: "week", featured: true },
          "https://evil.example"
        )
      )
    ).status
  ).toBe(403);
  expect(
    (await POST(request({ collectionId: "week", featured: "yes" }))).status
  ).toBe(400);
  expect(
    (await POST(request({ collectionId: "missing", featured: true }))).status
  ).toBe(404);
  expect(await listFeaturedCollections(MONSTERY_MONDAY)).toEqual([]);
});
