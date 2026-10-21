import { File } from "node:buffer";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import sharp from "sharp";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import {
  MONSTER_ARTWORK_MAX_FILE_SIZE,
  type MonsterArtwork,
} from "@/lib/monster-artwork";
import { setFeatureFlag } from "./featureFlags";
import {
  deleteMonsterArtworkIfUnreferenced,
  uploadMonsterArtwork,
} from "./monster-artwork";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "./monsters/official";
import {
  createMonster,
  deleteMonster,
  updateMonster,
} from "./monsters/repository";
import type {
  Monster,
  MonsterTeamMember,
  UpdateMonsterInput,
} from "./monsters/types";

const { getDatabase, uploadBlob, deleteBlobs } = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  uploadBlob: vi.fn<(...args: [string, Buffer, string]) => Promise<unknown>>(),
  deleteBlobs: vi.fn<(...args: [string[]]) => Promise<void>>(),
}));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));
vi.mock("@/lib/blob-storage", () => ({ uploadBlob, deleteBlobs }));

const directory = mkdtempSync(join(tmpdir(), "monster-artwork-test-"));
const client = createClient({ url: `file:${join(directory, "test.db")}` });
const db = drizzle(client, { schema: { ...schema, ...relations } });
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const { monsters: official } = validateOfficialMonstersJSON(
  JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
);
const original = official.find(
  (monster) => monster.attributes.name === "Black Pudding"
);
if (!original) throw new Error("Missing seeded monster");
const input = parseJSONAPIMonster(original);

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "migrations" });
});
afterAll(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});
beforeEach(async () => {
  getDatabase.mockReturnValue(db);
  uploadBlob.mockReset().mockResolvedValue({});
  deleteBlobs.mockReset().mockResolvedValue(undefined);
  await db.delete(schema.monsters);
  await db.delete(schema.monsterArtworks);
  await db.delete(schema.userFeatureFlags);
  await db.delete(schema.users);
  await db.insert(schema.users).values([
    { id: owner, discordId: "owner", username: "owner" },
    { id: other, discordId: "other", username: "other" },
  ]);
  await setFeatureFlag(owner, "monster-custom-artwork", true);
});

async function image(width = 2000, height = 1000) {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 20, g: 40, b: 60, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer();
  return new File([new Uint8Array(buffer)], "image.png", { type: "image/png" });
}
async function asset(userId = owner): Promise<MonsterArtwork> {
  const artwork = { id: crypto.randomUUID(), userId };
  await db
    .insert(schema.monsterArtworks)
    .values({ ...artwork, status: "ready" });
  return artwork;
}
function edit(monster: Monster): UpdateMonsterInput {
  return {
    ...monster,
    kind: monster.kind ?? "",
    bloodied: monster.bloodied ?? "",
    lastStand: monster.lastStand ?? "",
    saves: (monster.saves ?? "").split(" "),
    moreInfo: monster.moreInfo ?? "",
    sourceId: monster.source?.id,
  };
}
function member(customArtwork: MonsterArtwork): MonsterTeamMember {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    hp: input.hp,
    armor: input.armor === "" ? "none" : input.armor,
    size: input.size,
    actions: input.actions,
    abilities: input.abilities,
    customArtwork,
  };
}

describe("monster artwork image processing", () => {
  it("stores only two bounded WebPs, strips metadata, preserves alpha, and marks ready", async () => {
    const artwork = await uploadMonsterArtwork(owner, await image());
    expect(uploadBlob).toHaveBeenCalledTimes(2);
    for (const [
      index,
      [path, buffer, contentType],
    ] of uploadBlob.mock.calls.entries()) {
      expect(path).toBe(
        `monster-artwork/${owner}/${artwork.id}/${index ? "display-1600" : "thumbnail-256"}.webp`
      );
      expect(contentType).toBe("image/webp");
      const metadata = await sharp(buffer).metadata();
      expect(metadata).toMatchObject({
        format: "webp",
        width: index ? 1600 : 256,
        height: index ? 800 : 128,
        hasAlpha: true,
      });
      expect(metadata.exif).toBeUndefined();
    }
    expect((await db.select().from(schema.monsterArtworks))[0].status).toBe(
      "ready"
    );
  });
  it("does not enlarge small images and auto-rotates orientation", async () => {
    const buffer = await sharp({
      create: { width: 80, height: 40, channels: 3, background: "red" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    await uploadMonsterArtwork(
      owner,
      new File([new Uint8Array(buffer)], "rotated.jpg")
    );
    for (const [, output] of uploadBlob.mock.calls) {
      expect(await sharp(output).metadata()).toMatchObject({
        width: 40,
        height: 80,
      });
      expect((await sharp(output).metadata()).exif).toBeUndefined();
    }
  });
  it("rejects fake images, SVGs, empty and oversized files before storage", async () => {
    for (const file of [
      new File([], "empty.png"),
      new File(["fake"], "fake.png"),
      new File(['<svg width="20" height="20"></svg>'], "vector.svg"),
    ]) {
      await expect(uploadMonsterArtwork(owner, file)).rejects.toThrow();
    }
    const arrayBuffer = vi.fn<() => Promise<ArrayBuffer>>();
    await expect(
      uploadMonsterArtwork(owner, {
        size: MONSTER_ARTWORK_MAX_FILE_SIZE + 1,
        arrayBuffer,
      })
    ).rejects.toThrow("10 MB");
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(uploadBlob).not.toHaveBeenCalled();
    expect(await db.select().from(schema.monsterArtworks)).toEqual([]);
  });
  it("rejects over-dimension and over-pixel-limit images", async () => {
    await expect(
      uploadMonsterArtwork(owner, await image(12001, 1))
    ).rejects.toThrow("12,000");
    await expect(
      uploadMonsterArtwork(owner, await image(6500, 6500))
    ).rejects.toThrow();
    expect(uploadBlob).not.toHaveBeenCalled();
  });
  it("cleans both variants after a partial upload failure", async () => {
    uploadBlob.mockRejectedValueOnce(new Error("storage failure"));
    await expect(
      uploadMonsterArtwork(owner, await image(20, 20))
    ).rejects.toThrow("storage failure");
    expect(deleteBlobs.mock.calls[0][0]).toHaveLength(2);
    expect(await db.select().from(schema.monsterArtworks)).toEqual([]);
  });
});

describe("artwork mutation and deletion boundaries with real SQLite transactions", () => {
  it("round-trips parent/member artwork, refuses foreign ownership (including remixes), not-ready assets and contradictory selections", async () => {
    const own = await asset();
    const foreign = await asset(other);
    const monster = await createMonster(
      { ...input, customArtwork: own, members: [member(own)] },
      "owner"
    );
    expect(monster.customArtwork).toEqual(own);
    expect(monster.members?.[0].customArtwork).toEqual(own);
    await expect(
      createMonster(
        { ...input, customArtwork: foreign, remixedFromId: monster.id },
        "owner"
      )
    ).rejects.toThrow("owned by you");
    await expect(
      createMonster({ ...input, members: [member(foreign)] }, "owner")
    ).rejects.toThrow("owned by you");
    await expect(
      createMonster(
        { ...input, customArtwork: own, paperforgeId: "selection" },
        "owner"
      )
    ).rejects.toThrow("not both");
    await expect(
      createMonster(
        { ...input, members: [{ ...member(own), paperforgeId: "selection" }] },
        "owner"
      )
    ).rejects.toThrow("not both");
    await db
      .update(schema.monsterArtworks)
      .set({ status: "deleting" })
      .where(eq(schema.monsterArtworks.id, own.id));
    await expect(
      createMonster({ ...input, customArtwork: own }, "owner")
    ).rejects.toThrow("ready");
  });
  it("validates artwork schema at the repository boundary, rejecting URL injection", async () => {
    const own = await asset();
    await expect(
      createMonster(
        {
          ...input,
          customArtwork: { ...own, sourceUrl: "javascript:alert(1)" },
        },
        "owner"
      )
    ).rejects.toThrow("Invalid monster artwork");
    const injected = { ...own, url: "https://attacker.test/file.webp" };
    await expect(
      createMonster({ ...input, customArtwork: injected }, "owner")
    ).rejects.toThrow("Invalid monster artwork");
  });
  it("preserves omitted parent artwork and unchanged members after flag disable; rejects new attachment/metadata changes; permits removal", async () => {
    const own = await asset();
    let monster = await createMonster(
      { ...input, customArtwork: own, members: [member(own)] },
      "owner"
    );
    await setFeatureFlag(owner, "monster-custom-artwork", false);
    const { customArtwork: omitted, ...withoutArtwork } = edit(monster);
    monster = await updateMonster(
      { ...withoutArtwork, name: "Updated" },
      "owner"
    );
    expect(monster.customArtwork).toEqual(own);
    expect(monster.members?.[0].customArtwork).toEqual(own);
    await expect(
      createMonster({ ...input, customArtwork: own }, "owner")
    ).rejects.toThrow("not enabled");
    await expect(
      updateMonster(
        { ...edit(monster), customArtwork: { ...own, artist: "New artist" } },
        "owner"
      )
    ).rejects.toThrow("not enabled");
    await updateMonster(
      { ...edit(monster), customArtwork: null, members: [] },
      "owner"
    );
    expect(await db.select().from(schema.monsterArtworks)).toEqual([]);
    expect(deleteBlobs).toHaveBeenCalledTimes(1);
  });
  it("keeps shared artwork until its last parent/member reference disappears, then cleans on monster deletion", async () => {
    const own = await asset();
    const parent = await createMonster(
      { ...input, customArtwork: own },
      "owner"
    );
    const team = await createMonster(
      { ...input, members: [member(own)] },
      "owner"
    );
    expect(await deleteMonsterArtworkIfUnreferenced(own.id, other)).toBe(false);
    expect(await deleteMonsterArtworkIfUnreferenced(own.id, owner)).toBe(false);
    await deleteMonster(parent.id, "owner");
    expect(deleteBlobs).not.toHaveBeenCalled();
    expect(await deleteMonsterArtworkIfUnreferenced(own.id, owner)).toBe(false);
    await deleteMonster(team.id, "owner");
    expect(deleteBlobs).toHaveBeenCalledTimes(1);
    expect(await db.select().from(schema.monsterArtworks)).toEqual([]);
  });
  it("marks deleting before touching blobs so an attachment cannot race deletion", async () => {
    const own = await asset();
    deleteBlobs.mockImplementationOnce(async () => {
      await expect(
        createMonster({ ...input, customArtwork: own }, "owner")
      ).rejects.toThrow("ready");
    });
    expect(await deleteMonsterArtworkIfUnreferenced(own.id, owner)).toBe(true);
  });
  it("cleans replaced artwork but retains a same-owner remix reference", async () => {
    const old = await asset();
    const replacement = await asset();
    let monster = await createMonster(
      { ...input, customArtwork: old },
      "owner"
    );
    const remix = await createMonster(
      { ...input, remixedFromId: monster.id, customArtwork: old },
      "owner"
    );
    monster = await updateMonster(
      { ...edit(monster), customArtwork: replacement },
      "owner"
    );
    expect(monster.customArtwork).toEqual(replacement);
    expect(deleteBlobs).not.toHaveBeenCalled();
    await deleteMonster(remix.id, "owner");
    expect(
      deleteBlobs.mock.calls[0][0].every((path) => path.includes(old.id))
    ).toBe(true);
    expect(
      (await db.select().from(schema.monsterArtworks)).map((row) => row.id)
    ).toEqual([replacement.id]);
  });
  it("keeps a failed deletion non-attachable and retries it opportunistically", async () => {
    const own = await asset();
    deleteBlobs.mockRejectedValueOnce(
      new Error("storage temporarily unavailable")
    );
    expect(await deleteMonsterArtworkIfUnreferenced(own.id, owner)).toBe(false);
    expect((await db.select().from(schema.monsterArtworks))[0].status).toBe(
      "deleting"
    );
    await expect(
      createMonster({ ...input, customArtwork: own }, "owner")
    ).rejects.toThrow("ready");
    await db
      .update(schema.monsterArtworks)
      .set({ updatedAt: "2000-01-01 00:00:00" });
    await uploadMonsterArtwork(owner, await image(10, 10));
    expect(
      (await db.select().from(schema.monsterArtworks)).map((row) => row.id)
    ).not.toContain(own.id);
  });
  it("retries stale abandoned assets on upload but never cleans referenced or other-owner assets", async () => {
    const abandoned = await asset();
    const referenced = await asset();
    const foreign = await asset(other);
    await createMonster({ ...input, members: [member(referenced)] }, "owner");
    await db
      .update(schema.monsterArtworks)
      .set({ updatedAt: "2000-01-01 00:00:00" });
    await uploadMonsterArtwork(owner, await image(10, 10));
    const ids = (await db.select().from(schema.monsterArtworks)).map(
      (row) => row.id
    );
    expect(ids).not.toContain(abandoned.id);
    expect(ids).toContain(referenced.id);
    expect(ids).toContain(foreign.id);
    expect(deleteBlobs).toHaveBeenCalledTimes(1);
  });
});
