import { revalidateTag } from "next/cache";

export async function preloadImage(
  entityType: "item" | "monster" | "companion",
  entityId: string,
  baseUrl: string
): Promise<ArrayBuffer> {
  const entityPageUrl = (() => {
    switch (entityType) {
      case "monster":
        return `${baseUrl}/m/${entityId}`;
      case "companion":
        return `${baseUrl}/c/${entityId}`;
      case "item":
        return `${baseUrl}/items/${entityId}`;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  })();
  const response = await fetch(`${entityPageUrl}/image`);
  if (!response.ok) {
    throw new Error(`Failed to generate item image: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

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
