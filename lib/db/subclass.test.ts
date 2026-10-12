import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import {
  type CreateSubclassInput,
  createSubclass,
  findSubclass,
  updateSubclass,
} from "./subclass";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

let client: Client;
let directory: string;
const ownerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const input: CreateSubclassInput = {
  name: "Original",
  className: "Berserker",
  visibility: "private",
  discordId: "owner",
  levels: [
    {
      level: 3,
      abilities: [{ id: "example", name: "Fury", description: "Gain fury." }],
    },
  ],
  abilityLists: [
    {
      name: "Options",
      description: "",
      items: [{ name: "Mist", description: "Keep this item." }],
    },
  ],
};

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "subclass-ownership-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
  await db.insert(schema.users).values([
    { id: ownerId, username: "owner", discordId: "owner" },
    { id: otherId, username: "other", discordId: "other" },
  ]);
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

it("rejects foreign or missing option lists before any create/update writes", async () => {
  const original = await createSubclass(input);
  const foreign = await createSubclass({ ...input, discordId: "other" });
  const ownListId = original.abilityLists[0].id;
  for (const id of [
    foreign.abilityLists[0].id,
    "33333333-3333-4333-8333-333333333333",
  ]) {
    const invalid = {
      ...input,
      name: "Rejected",
      abilityListIds: [ownListId, id],
    };
    await expect(createSubclass(invalid)).rejects.toThrow(
      "Option lists must belong to the subclass creator"
    );
    await expect(
      updateSubclass({ ...invalid, id: original.id })
    ).rejects.toThrow("Option lists must belong to the subclass creator");
    expect(await findSubclass(original.id)).toEqual(original);
    expect(await findSubclass(foreign.id)).toEqual(foreign);
    expect(await getDatabase().select().from(schema.subclasses)).toHaveLength(
      2
    );
  }
});

it("allows owned lists and retains their IDs, items and requested order on update", async () => {
  const source = await createSubclass({
    ...input,
    abilityLists: [
      ...(input.abilityLists || []),
      {
        name: "Second",
        description: "",
        items: [{ name: "Storm", description: "" }],
      },
    ],
  });
  const ids = source.abilityLists.map(({ id }) => id).reverse();
  const linked = await createSubclass({
    ...input,
    abilityLists: [],
    abilityListIds: ids,
  });
  expect(linked.abilityLists.map(({ id }) => id)).toEqual(ids);
  const updated = await updateSubclass({
    ...input,
    id: linked.id,
    abilityLists: [],
    abilityListIds: ids,
  });
  expect(updated.abilityLists).toEqual(linked.abilityLists);
  expect(await findSubclass(source.id)).toEqual(source);
});

it("detaches legacy foreign/shared links without deleting their lists, but removes replaced exclusive lists", async () => {
  const original = await createSubclass(input);
  const foreign = await createSubclass({ ...input, discordId: "other" });
  const shared = await createSubclass(input);
  const classShared = await createSubclass(input);
  const db = getDatabase();
  // Simulate pre-policy links, without using the now-protected write interface.
  await db.insert(schema.subclassesClassAbilityLists).values([
    {
      subclassId: original.id,
      abilityListId: foreign.abilityLists[0].id,
      orderIndex: 1,
    },
    {
      subclassId: original.id,
      abilityListId: shared.abilityLists[0].id,
      orderIndex: 2,
    },
  ]);
  const [classEntity] = await db
    .insert(schema.classes)
    .values({
      name: "Shared class",
      description: "",
      hitDie: "d6",
      startingHp: 7,
      userId: ownerId,
    })
    .returning();
  await db.insert(schema.classesClassAbilityLists).values({
    classId: classEntity.id,
    abilityListId: classShared.abilityLists[0].id,
    orderIndex: 0,
  });
  const updated = await updateSubclass({
    ...input,
    id: original.id,
    abilityLists: [],
  });
  expect(updated.abilityLists).toEqual([]);
  expect(await findSubclass(foreign.id)).toEqual(foreign);
  expect(await findSubclass(shared.id)).toEqual(shared);
  expect(
    await db
      .select()
      .from(schema.classAbilityLists)
      .where(eq(schema.classAbilityLists.id, original.abilityLists[0].id))
  ).toHaveLength(0);
  expect(
    await db
      .select()
      .from(schema.classAbilityItems)
      .where(
        eq(
          schema.classAbilityItems.classAbilityListId,
          original.abilityLists[0].id
        )
      )
  ).toHaveLength(0);
  await updateSubclass({ ...input, id: classShared.id, abilityLists: [] });
  expect(
    await db
      .select()
      .from(schema.classesClassAbilityLists)
      .where(eq(schema.classesClassAbilityLists.classId, classEntity.id))
  ).toHaveLength(1);
  expect(
    await db
      .select()
      .from(schema.classAbilityItems)
      .where(
        eq(
          schema.classAbilityItems.classAbilityListId,
          classShared.abilityLists[0].id
        )
      )
  ).toHaveLength(1);
});
