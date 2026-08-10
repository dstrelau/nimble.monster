import { and, eq } from "drizzle-orm";
import sharp from "sharp";
import {
  ADVENTURE_IMAGE_MAX_DIMENSION,
  ADVENTURE_IMAGE_MAX_FILE_SIZE,
  ADVENTURE_IMAGE_MAX_PIXELS,
  getAdventureImagePaths,
  getAdventureImageUrls,
} from "@/lib/adventure-images";
import { deleteBlobs, uploadBlob } from "@/lib/blob-storage";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type AdventureImageExtension,
  adventureImages,
  adventureNodes,
} from "@/lib/db/schema";

const ALLOWED_FORMATS = new Map<string, AdventureImageExtension>([
  ["jpeg", "jpg"],
  ["png", "png"],
  ["webp", "webp"],
]);

interface AdventureImageFile {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function uploadAdventureImage(
  userId: string,
  file: AdventureImageFile
) {
  if (file.size === 0) throw new Error("Choose an image to upload");
  if (file.size > ADVENTURE_IMAGE_MAX_FILE_SIZE) {
    throw new Error("Images must be 10 MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const source = sharp(buffer, {
    failOn: "warning",
    limitInputPixels: ADVENTURE_IMAGE_MAX_PIXELS,
  });
  let metadata: sharp.Metadata;
  try {
    metadata = await source.metadata();
  } catch {
    throw new Error("The file is not a supported image");
  }
  const extension = metadata.format
    ? ALLOWED_FORMATS.get(metadata.format)
    : undefined;
  if (!extension || !metadata.width || !metadata.height) {
    throw new Error("Only JPEG, PNG, and WebP images are supported");
  }
  if (
    metadata.width > ADVENTURE_IMAGE_MAX_DIMENSION ||
    metadata.height > ADVENTURE_IMAGE_MAX_DIMENSION ||
    metadata.width * metadata.height > ADVENTURE_IMAGE_MAX_PIXELS
  ) {
    throw new Error(
      "Images may be at most 12,000 pixels wide or tall and 40 megapixels"
    );
  }

  const imageId = crypto.randomUUID();
  const paths = getAdventureImagePaths(userId, imageId, extension);
  const db = getDatabase();
  await db.insert(adventureImages).values({
    id: imageId,
    userId,
    extension,
    status: "uploading",
  });
  const [thumbnail, display] = await Promise.all([
    sharp(buffer, { limitInputPixels: ADVENTURE_IMAGE_MAX_PIXELS })
      .rotate()
      .resize({
        width: 480,
        height: 480,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer(),
    sharp(buffer, { limitInputPixels: ADVENTURE_IMAGE_MAX_PIXELS })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer(),
  ]);

  await Promise.all([
    uploadBlob(paths.original, buffer, `image/${metadata.format}`),
    uploadBlob(paths.thumbnail, thumbnail, "image/webp"),
    uploadBlob(paths.display, display, "image/webp"),
  ]);
  await db
    .update(adventureImages)
    .set({ status: "ready", updatedAt: new Date().toISOString() })
    .where(eq(adventureImages.id, imageId));

  return getAdventureImageUrls(userId, imageId, extension);
}

export async function deleteAdventureImageIfUnreferenced(
  imageId: string,
  userId: string
): Promise<boolean> {
  const db = getDatabase();
  let image: { extension: AdventureImageExtension } | undefined;

  await db.transaction(async (tx) => {
    const [ownedImage] = await tx
      .select({ extension: adventureImages.extension })
      .from(adventureImages)
      .where(
        and(eq(adventureImages.id, imageId), eq(adventureImages.userId, userId))
      )
      .limit(1);
    if (!ownedImage) return;

    const [reference] = await tx
      .select({ id: adventureNodes.id })
      .from(adventureNodes)
      .where(eq(adventureNodes.imageId, imageId))
      .limit(1);
    if (reference) return;

    await tx
      .update(adventureImages)
      .set({ status: "deleting", updatedAt: new Date().toISOString() })
      .where(eq(adventureImages.id, imageId));
    image = ownedImage;
  });

  if (!image) return false;
  const paths = getAdventureImagePaths(userId, imageId, image.extension);
  try {
    await deleteBlobs([paths.original, paths.thumbnail, paths.display]);
    await db
      .delete(adventureImages)
      .where(
        and(eq(adventureImages.id, imageId), eq(adventureImages.userId, userId))
      );
    return true;
  } catch {
    return false;
  }
}
