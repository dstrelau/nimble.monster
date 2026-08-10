import type { AdventureImageExtension } from "./db/schema";

export const ADVENTURE_IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ADVENTURE_IMAGE_MAX_DIMENSION = 12_000;
export const ADVENTURE_IMAGE_MAX_PIXELS = 40_000_000;
export const ADVENTURE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export interface AdventureImageAsset {
  id: string;
  extension: AdventureImageExtension;
  originalUrl: string;
  thumbnailUrl: string;
  displayUrl: string;
}

function imagePrefix(userId: string, imageId: string) {
  return `adventure-images/${userId}/${imageId}`;
}

export function getAdventureImagePaths(
  userId: string,
  imageId: string,
  extension: AdventureImageExtension
) {
  const prefix = imagePrefix(userId, imageId);
  return {
    original: `${prefix}/original.${extension}`,
    thumbnail: `${prefix}/thumbnail-480.webp`,
    display: `${prefix}/display-1600.webp`,
  };
}

export function getAdventureImageUrls(
  userId: string,
  imageId: string,
  extension: AdventureImageExtension
): AdventureImageAsset {
  const paths = getAdventureImagePaths(userId, imageId, extension);
  const bucket = process.env.NEXT_PUBLIC_BUCKET_NAME;
  const url = (path: string) =>
    bucket && process.env.NODE_ENV !== "development"
      ? `https://${bucket}.fly.storage.tigris.dev/${path}`
      : `/blob-storage/${path}`;

  return {
    id: imageId,
    extension,
    originalUrl: url(paths.original),
    thumbnailUrl: url(paths.thumbnail),
    displayUrl: url(paths.display),
  };
}
