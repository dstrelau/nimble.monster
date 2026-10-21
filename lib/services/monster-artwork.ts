import { trace } from "@opentelemetry/api";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import {
  ADVENTURE_IMAGE_MAX_DIMENSION,
  ADVENTURE_IMAGE_MAX_PIXELS,
} from "@/lib/adventure-images";
import { deleteBlobs, uploadBlob } from "@/lib/blob-storage";
import { type Database, getDatabase } from "@/lib/db/drizzle";
import { monsterArtworks, monsters, userFeatureFlags } from "@/lib/db/schema";
import {
  getMonsterArtworkPaths,
  MONSTER_ARTWORK_MAX_FILE_SIZE,
  type MonsterArtwork,
  monsterArtworkSchema,
} from "@/lib/monster-artwork";
import { recordError } from "@/lib/telemetry";

export class MonsterArtworkInputError extends Error {}

type ArtworkTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
interface ArtworkSelection {
  customArtwork?: MonsterArtwork | null;
  paperforgeId?: string | null;
}
interface ArtworkState extends ArtworkSelection {
  members?: ArtworkSelection[];
}

export function collectMonsterArtwork(state: ArtworkState): MonsterArtwork[] {
  return [state, ...(state.members ?? [])].flatMap((selection) =>
    selection.customArtwork ? [selection.customArtwork] : []
  );
}

/** Must run in the same write transaction as the mutation, never before it. */
export async function validateMonsterArtwork(
  tx: ArtworkTransaction,
  userId: string,
  next: ArtworkState,
  previous: ArtworkState = {}
): Promise<void> {
  const selections = [next, ...(next.members ?? [])];
  const oldSelections = [previous, ...(previous.members ?? [])];
  let needsFlag = false;
  for (const [index, selection] of selections.entries()) {
    if (
      selection.customArtwork === undefined ||
      selection.customArtwork === null
    )
      continue;
    const parsed = monsterArtworkSchema
      .strict()
      .safeParse(selection.customArtwork);
    if (!parsed.success)
      throw new MonsterArtworkInputError("Invalid monster artwork");
    const artwork = parsed.data;
    if (selection.paperforgeId) {
      throw new MonsterArtworkInputError(
        "Choose custom artwork or Paper Forge, not both"
      );
    }
    const [asset] = await tx
      .select()
      .from(monsterArtworks)
      .where(
        and(
          eq(monsterArtworks.id, artwork.id),
          eq(monsterArtworks.userId, userId),
          eq(monsterArtworks.status, "ready")
        )
      )
      .limit(1);
    if (artwork.userId !== userId || !asset) {
      throw new MonsterArtworkInputError(
        "Artwork must be owned by you and ready"
      );
    }
    const old = oldSelections[index]?.customArtwork;
    if (
      !old ||
      old.id !== artwork.id ||
      old.userId !== artwork.userId ||
      old.artist !== artwork.artist ||
      old.sourceUrl !== artwork.sourceUrl
    )
      needsFlag = true;
  }
  if (needsFlag) {
    const [flag] = await tx
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, userId),
          eq(userFeatureFlags.feature, "monster-custom-artwork"),
          eq(userFeatureFlags.enabled, true)
        )
      )
      .limit(1);
    if (!flag)
      throw new MonsterArtworkInputError(
        "Custom monster artwork is not enabled"
      );
  }
}

export async function deleteMonsterArtworkIfUnreferenced(
  id: string,
  userId: string
): Promise<boolean> {
  const db = getDatabase();
  const claimed = await db.transaction(async (tx) => {
    const [asset] = await tx
      .select()
      .from(monsterArtworks)
      .where(
        and(eq(monsterArtworks.id, id), eq(monsterArtworks.userId, userId))
      )
      .limit(1);
    if (!asset) return false;
    // Search every monster, including team members and private entries. A copied
    // asset must survive until its very last reference has been removed.
    const [reference] = await tx
      .select({ id: monsters.id })
      .from(monsters)
      .where(sql`
      json_extract(${monsters.customArtwork}, '$.id') = ${id}
      OR EXISTS (SELECT 1 FROM json_each(${monsters.members}) AS member
        WHERE json_extract(member.value, '$.customArtwork.id') = ${id})
    `)
      .limit(1);
    if (reference) return false;
    await tx
      .update(monsterArtworks)
      .set({ status: "deleting", updatedAt: new Date().toISOString() })
      .where(eq(monsterArtworks.id, id));
    return true;
  });
  if (!claimed) return false;
  try {
    await deleteBlobs(Object.values(getMonsterArtworkPaths({ id, userId })));
    await db
      .delete(monsterArtworks)
      .where(
        and(
          eq(monsterArtworks.id, id),
          eq(monsterArtworks.userId, userId),
          eq(monsterArtworks.status, "deleting")
        )
      );
    return true;
  } catch (error) {
    trace
      .getTracer("monster-artwork")
      .startActiveSpan("monster-artwork.cleanup", (span) => {
        recordError(span, error);
        span.end();
      });
    return false;
  }
}

/** Best effort cleanup: never turn a successful monster mutation into a failure. */
export async function cleanupMonsterArtwork(
  userId: string,
  artwork: MonsterArtwork[]
): Promise<void> {
  for (const id of new Set(artwork.map((item) => item.id))) {
    try {
      await deleteMonsterArtworkIfUnreferenced(id, userId);
    } catch (error) {
      trace
        .getTracer("monster-artwork")
        .startActiveSpan("monster-artwork.cleanup", (span) => {
          recordError(span, error);
          span.end();
        });
    }
  }
}

interface ArtworkFile {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function uploadMonsterArtwork(
  userId: string,
  file: ArtworkFile
): Promise<MonsterArtwork> {
  if (!file.size)
    throw new MonsterArtworkInputError("Choose an image to upload");
  if (file.size > MONSTER_ARTWORK_MAX_FILE_SIZE)
    throw new MonsterArtworkInputError("Images must be 10 MB or smaller");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MONSTER_ARTWORK_MAX_FILE_SIZE)
    throw new MonsterArtworkInputError("Images must be 10 MB or smaller");
  let variants: Buffer[];
  try {
    const source = sharp(buffer, {
      failOn: "warning",
      limitInputPixels: ADVENTURE_IMAGE_MAX_PIXELS,
    });
    const metadata = await source.metadata();
    if (
      !metadata.format ||
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new MonsterArtworkInputError(
        "Only single-frame JPEG, PNG, and WebP images are supported"
      );
    }
    if (
      metadata.width > ADVENTURE_IMAGE_MAX_DIMENSION ||
      metadata.height > ADVENTURE_IMAGE_MAX_DIMENSION ||
      metadata.width * metadata.height > ADVENTURE_IMAGE_MAX_PIXELS
    ) {
      throw new MonsterArtworkInputError(
        "Images may be at most 12,000 pixels wide or tall and 40 megapixels"
      );
    }
    // Sharp strips metadata by default; no flatten() so alpha is preserved.
    variants = await Promise.all(
      [256, 1600].map((size) =>
        source
          .clone()
          .rotate()
          .resize({
            width: size,
            height: size,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer()
      )
    );
  } catch (error) {
    if (error instanceof MonsterArtworkInputError) throw error;
    throw new MonsterArtworkInputError("The file is not a supported image");
  }

  const db = getDatabase();
  const stale = await db
    .select()
    .from(monsterArtworks)
    .where(
      and(
        eq(monsterArtworks.userId, userId),
        sql`datetime(${monsterArtworks.updatedAt}) < datetime('now', '-24 hours')`
      )
    );
  await cleanupMonsterArtwork(userId, stale);
  const artwork = { id: crypto.randomUUID(), userId };
  await db.insert(monsterArtworks).values({ ...artwork, status: "uploading" });
  const paths = Object.values(getMonsterArtworkPaths(artwork));
  try {
    // Wait for *all* writes before cleanup, even when one fails, so a late
    // successful upload cannot recreate a blob after deletion.
    const uploads = await Promise.allSettled(
      paths.map((path, index) =>
        uploadBlob(path, variants[index], "image/webp")
      )
    );
    const failed = uploads.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
    const ready = await db
      .update(monsterArtworks)
      .set({ status: "ready", updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(monsterArtworks.id, artwork.id),
          eq(monsterArtworks.status, "uploading")
        )
      );
    if (ready.rowsAffected !== 1)
      throw new Error("Artwork upload was cancelled");
    return artwork;
  } catch (error) {
    await cleanupMonsterArtwork(userId, [artwork]);
    throw error;
  }
}
