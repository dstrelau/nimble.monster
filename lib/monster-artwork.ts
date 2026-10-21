import { z } from "zod";
import { isValidUUID } from "@/lib/utils/validation";

export const MONSTER_ARTWORK_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MONSTER_ARTWORK_ACCEPT = "image/jpeg,image/png,image/webp";

export const monsterArtworkSchema = z.object({
  id: z.uuid(),
  userId: z.string().refine(isValidUUID, "Invalid owner ID"),
  artist: z.string().trim().max(200).optional(),
  sourceUrl: z
    .url()
    .max(2048)
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "Use an HTTP or HTTPS URL",
    })
    .optional(),
});

export type MonsterArtwork = z.infer<typeof monsterArtworkSchema>;

export function getMonsterArtworkPaths(
  artwork: Pick<MonsterArtwork, "id" | "userId">
) {
  const prefix = `monster-artwork/${artwork.userId}/${artwork.id}`;
  return {
    thumbnail: `${prefix}/thumbnail-256.webp`,
    display: `${prefix}/display-1600.webp`,
  };
}

export function getMonsterArtworkUrl(artwork: MonsterArtwork, size = 88) {
  const paths = getMonsterArtworkPaths(artwork);
  const path = size <= 256 ? paths.thumbnail : paths.display;
  const bucket = process.env.NEXT_PUBLIC_BUCKET_NAME;
  return bucket && process.env.NODE_ENV !== "development"
    ? `https://${bucket}.fly.storage.tigris.dev/${path}`
    : `/blob-storage/${path}`;
}
