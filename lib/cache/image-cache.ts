import { revalidateTag } from "next/cache";

export function getImageCacheTag(
  entityType: "item" | "monster" | "companion",
  entityId: string
): string {
  return `${entityType}-image-${entityId}`;
}

export function invalidateEntityImageCache(
  entityType: "item" | "monster" | "companion",
  entityId: string
): void {
  const cacheTag = getImageCacheTag(entityType, entityId);
  revalidateTag(cacheTag);
}
