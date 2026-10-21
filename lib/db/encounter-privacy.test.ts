import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
  PUBLIC_ENCOUNTER_CONTENT_ERROR,
  UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
} from "@/lib/encounter-privacy";
import {
  listPublicEncounters,
  searchEncountersForCreator,
} from "@/lib/services/encounters/repository";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  createHazard,
  createMonster,
  updateHazard,
  updateMonster,
} from "@/lib/services/monsters/repository";
import {
  addMonsterToEncounter,
  createEncounter,
  findEncounterOverviewsByIds,
  getEncounter,
  getPublicEncounterById,
  isMonsterInOtherUsersEncounter,
  listEncountersWithMonstersForUser,
  updateEncounter,
} from "./encounter";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

let client: Client;
let directory: string;
const ownerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const { monsters: officialMonsters } = validateOfficialMonstersJSON(
  JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
);
const officialInput = parseJSONAPIMonster(officialMonsters[0]);

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "encounter-privacy-"));
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

describe("encounter privacy", () => {
  it.each([false, true])(
    "creator search withholds foreign private content and keeps own content only in private encounters (hazard=%s)",
    async (hazard) => {
      const entry = hazard
        ? await createHazard(officialInput, "owner")
        : await createMonster(officialInput, "owner");
      const control = await createMonster(
        parseJSONAPIMonster(officialMonsters[1]),
        "other"
      );
      const input = {
        discordId: "owner",
        name: "Search QA",
        visibility: "public" as const,
        heroCount: 4,
        heroLevel: 2,
        monsters: [
          { monsterId: entry.id, quantity: 3, isPerHero: false },
          { monsterId: control.id, quantity: 2, isPerHero: false },
        ],
      };
      const ownPublic = await createEncounter(input);
      const ownPrivate = await createEncounter({
        ...input,
        visibility: "private",
      });
      await createEncounter({ ...input, discordId: "other" });
      await createEncounter({
        ...input,
        discordId: "other",
        visibility: "private",
      });
      await getDatabase()
        .update(schema.monsters)
        .set({ visibility: "private" })
        .where(eq(schema.monsters.id, entry.id));
      const params = {
        sortBy: "name" as const,
        sortDirection: "asc" as const,
        limit: 10,
      };
      const otherList = await searchEncountersForCreator({
        ...params,
        creatorId: otherId,
      });
      expect(otherList).toHaveLength(2);
      for (const encounter of otherList) {
        expect(encounter.monsters.map(({ monster }) => monster.id)).toEqual([
          control.id,
        ]);
      }
      expect(JSON.stringify(otherList)).not.toContain(entry.name);
      const ownList = await searchEncountersForCreator({
        ...params,
        creatorId: ownerId,
      });
      expect(
        ownList
          .find(({ id }) => id === ownPublic.id)
          ?.monsters.map(({ monster }) => monster.id)
      ).toEqual([control.id]);
      expect(
        ownList
          .find(({ id }) => id === ownPrivate.id)
          ?.monsters.map(({ monster }) => monster.id)
          .sort()
      ).toEqual([entry.id, control.id].sort());
    }
  );

  it("rejects missing references without partial writes and rolls back link-write failures", async () => {
    const entry = await createMonster(officialInput, "owner");
    const link = { monsterId: entry.id, quantity: 2, isPerHero: false };
    const input = {
      discordId: "owner",
      name: "Original",
      visibility: "public" as const,
      heroCount: 4,
      heroLevel: 2,
      monsters: [link],
    };
    const encounter = await createEncounter(input);
    const missing = {
      ...link,
      monsterId: "99999999-9999-4999-8999-999999999999",
    };
    await expect(
      createEncounter({ ...input, monsters: [link, missing] })
    ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
    await expect(
      updateEncounter({
        ...input,
        id: encounter.id,
        name: "Changed",
        monsters: [link, missing],
      })
    ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
    await expect(
      addMonsterToEncounter({ ...missing, encounterId: encounter.id })
    ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
    expect(await getDatabase().select().from(schema.encounters)).toHaveLength(
      1
    );
    expect(await getEncounter(encounter.id, "owner")).toMatchObject({
      name: "Original",
      monsters: [{ quantity: 2, monster: { id: entry.id } }],
    });

    await client.execute(
      "CREATE TRIGGER fail_qa_link BEFORE INSERT ON monsters_encounters WHEN NEW.quantity = 13 BEGIN SELECT RAISE(ABORT, 'QA link failure'); END"
    );
    await expect(
      createEncounter({ ...input, monsters: [{ ...link, quantity: 13 }] })
    ).rejects.toThrow();
    await expect(
      updateEncounter({
        ...input,
        id: encounter.id,
        name: "Changed",
        visibility: "private",
        monsters: [{ ...link, quantity: 13 }],
      })
    ).rejects.toThrow();
    expect(await getDatabase().select().from(schema.encounters)).toHaveLength(
      1
    );
    expect(await getEncounter(encounter.id, "owner")).toMatchObject({
      name: "Original",
      visibility: "public",
      monsters: [{ quantity: 2, monster: { id: entry.id } }],
    });
  });

  it.each([false, true])(
    "warns only for another user's references, regardless of encounter visibility (hazard=%s)",
    async (hazard) => {
      const entry = hazard
        ? await createHazard(officialInput, "owner")
        : await createMonster(officialInput, "owner");
      const input = {
        discordId: "owner",
        name: "Own encounter",
        visibility: "public" as const,
        heroCount: 4,
        heroLevel: 2,
        monsters: [{ monsterId: entry.id, quantity: 1, isPerHero: false }],
      };
      expect(await isMonsterInOtherUsersEncounter(entry.id, ownerId)).toBe(
        false
      );
      await createEncounter(input);
      expect(await isMonsterInOtherUsersEncounter(entry.id, ownerId)).toBe(
        false
      );
      const otherEncounter = await createEncounter({
        ...input,
        discordId: "other",
      });
      expect(await isMonsterInOtherUsersEncounter(entry.id, ownerId)).toBe(
        true
      );
      await updateEncounter({
        ...input,
        discordId: "other",
        id: otherEncounter.id,
        visibility: "private",
      });
      expect(await isMonsterInOtherUsersEncounter(entry.id, ownerId)).toBe(
        true
      );
      await updateEncounter({
        ...input,
        discordId: "other",
        id: otherEncounter.id,
        monsters: [],
      });
      expect(await isMonsterInOtherUsersEncounter(entry.id, ownerId)).toBe(
        false
      );
    }
  );

  it.each([false, true])(
    "preserves creator control without exposing private content (hazard=%s)",
    async (hazard) => {
      const entry = hazard
        ? await createHazard(
            { ...officialInput, visibility: "public" },
            "owner"
          )
        : await createMonster(
            { ...officialInput, visibility: "public" },
            "owner"
          );
      const control = await createMonster(
        parseJSONAPIMonster(officialMonsters[1]),
        "other"
      );
      const link = { monsterId: entry.id, quantity: 3, isPerHero: false };
      const input = {
        discordId: "other",
        name: "Shared encounter",
        visibility: "public" as const,
        heroCount: 4,
        heroLevel: 2,
        monsters: [
          link,
          { monsterId: control.id, quantity: 2, isPerHero: false },
        ],
      };
      const encounter = await createEncounter(input);
      expect(
        (await getPublicEncounterById(encounter.id))?.monsters
      ).toHaveLength(2);

      // Exercise the creator's normal update interface, not a direct SQL visibility write.
      if (entry.hazard) {
        await updateHazard(
          {
            ...entry,
            visibility: "private",
            moreInfo: entry.moreInfo ?? "",
            remixedFromId: entry.remixedFromId ?? undefined,
          },
          "owner"
        );
      } else {
        await updateMonster(
          {
            ...entry,
            visibility: "private",
            kind: entry.kind ?? "",
            bloodied: entry.bloodied ?? "",
            lastStand: entry.lastStand ?? "",
            saves: entry.saves?.split(/[\s,]+/).filter(Boolean) ?? [],
            moreInfo: entry.moreInfo ?? "",
          },
          "owner"
        );
      }
      const publicView = await getPublicEncounterById(encounter.id);
      expect(publicView?.visibility).toBe("public");
      expect(publicView?.monsters.map(({ monster }) => monster.id)).toEqual([
        control.id,
      ]);
      expect(publicView?.unavailableMonsterIds).toBeUndefined();
      expect(JSON.stringify(publicView)).not.toContain(entry.name);
      const ownerView = await getEncounter(encounter.id, "other");
      expect(ownerView?.monsters.map(({ monster }) => monster.id)).toEqual([
        control.id,
      ]);
      expect(ownerView?.unavailableMonsterIds).toEqual([entry.id]);
      expect(
        (await getEncounter(encounter.id, "owner"))?.monsters.map(
          ({ monster }) => monster.id
        )
      ).toEqual([control.id]);
      expect(
        (await listEncountersWithMonstersForUser("other"))[0].monsters.map(
          ({ monster }) => monster.id
        )
      ).toEqual([control.id]);
      expect(
        (await findEncounterOverviewsByIds([encounter.id]))[0].monsters.map(
          ({ monster }) => monster.id
        )
      ).toEqual([control.id]);
      expect(
        (await listPublicEncounters({})).encounters[0].monsters.map(
          ({ monster }) => monster.id
        )
      ).toEqual([control.id]);

      await expect(
        addMonsterToEncounter({
          monsterId: control.id,
          quantity: 7,
          isPerHero: false,
          encounterId: encounter.id,
        })
      ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
      expect(
        (await getEncounter(encounter.id, "other"))?.monsters[0].quantity
      ).toBe(2);

      await expect(
        updateEncounter({ ...input, id: encounter.id })
      ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
      await expect(
        updateEncounter({ ...input, id: encounter.id, monsters: undefined })
      ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
      await expect(
        updateEncounter({ ...input, id: encounter.id, visibility: "private" })
      ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
      await expect(
        updateEncounter({
          ...input,
          id: encounter.id,
          discordId: "owner",
          monsters: [],
        })
      ).rejects.toThrow("Encounter not found");

      const ownPrivate = await createEncounter({
        ...input,
        discordId: "owner",
        visibility: "private",
      });
      expect(
        (await getEncounter(ownPrivate.id, "owner"))?.monsters.map(
          ({ monster }) => monster.id
        )
      ).toEqual(expect.arrayContaining([entry.id, control.id]));
      expect(await getEncounter(ownPrivate.id, "other")).toBeNull();
      await expect(
        updateEncounter({ ...input, id: ownPrivate.id, discordId: "owner" })
      ).rejects.toThrow(PUBLIC_ENCOUNTER_CONTENT_ERROR);
      expect((await getEncounter(ownPrivate.id, "owner"))?.visibility).toBe(
        "private"
      );
      await expect(
        createEncounter({ ...input, discordId: "owner" })
      ).rejects.toThrow(PUBLIC_ENCOUNTER_CONTENT_ERROR);
      await expect(
        createEncounter({ ...input, visibility: "private" })
      ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
      expect(await getDatabase().select().from(schema.encounters)).toHaveLength(
        2
      );

      const saved = await updateEncounter({
        ...input,
        id: encounter.id,
        monsters: [],
      });
      expect(saved.visibility).toBe("public");
      expect(saved.monsters).toEqual([]);
      await expect(
        addMonsterToEncounter({ ...link, encounterId: encounter.id })
      ).rejects.toThrow(UNAVAILABLE_ENCOUNTER_CONTENT_ERROR);
      const ownPublic = await createEncounter({
        ...input,
        discordId: "owner",
        monsters: [],
      });
      await expect(
        addMonsterToEncounter({ ...link, encounterId: ownPublic.id })
      ).rejects.toThrow(PUBLIC_ENCOUNTER_CONTENT_ERROR);
      expect(
        (
          await getDatabase()
            .select()
            .from(schema.monsters)
            .where(eq(schema.monsters.id, entry.id))
        )[0].visibility
      ).toBe("private");
    }
  );
});
