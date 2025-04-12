/**
 * A simple image caching system that uses the filesystem
 * and includes timestamps in filenames for cache invalidation
 */

import fs from "fs/promises";
import path from "path";
import os from "os";
import { findPublicMonsterById } from "@/lib/db";
import { Monster } from "../types";

// Create a singleton cache directory path
const CACHE_DIR = path.join(os.tmpdir(), "nimble-monster-images");

/**
 * Initialize the cache directory
 */
async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

/**
 * Get the cache filename for a monster
 * @param monsterId The monster ID
 * @param updatedAt Optional timestamp to use in the filename
 * @returns The cache filename
 */
function getCacheFilename(monsterId: string, timestamp: string): string {
  if (timestamp) {
    // Use the timestamp directly (should already be a numeric string)
    return path.join(CACHE_DIR, `${monsterId}_${timestamp}.png`);
  }
  return path.join(CACHE_DIR, `${monsterId}_*.png`);
}

/**
 * Find an existing cached image that matches the monster's current updatedAt time
 * @param monsted The monster
 * @returns Promise<string | null> The path to the cached image or null if not found
 */
async function findCachedImage(monster: Monster): Promise<string | null> {
  try {
    // Generate the exact filename we expect based on the monster's updatedAt timestamp
    const timestamp = monster.updatedAt.getTime().toString();
    const expectedFilename = getCacheFilename(monster.id, timestamp);

    // Check if this file exists
    try {
      await fs.access(expectedFilename);
      return expectedFilename;
    } catch {
      // File doesn't exist with the current timestamp
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Get a cached monster image if available
 * @param monster The monster
 * @returns Promise<Buffer | null> The cached image or null if not found
 */
export async function getCachedMonsterImage(
  monster: Monster,
): Promise<Buffer | null> {
  const cachedImagePath = await findCachedImage(monster);

  if (cachedImagePath) {
    try {
      return await fs.readFile(cachedImagePath);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Store a monster image in the cache using the monster's updatedAt timestamp in the filename
 * @param monsterId The monster ID
 * @param imageData The image data to cache
 */
export async function cacheMonsterImage(
  monsterId: string,
  imageData: Buffer,
): Promise<void> {
  try {
    // Ensure cache directory exists
    await ensureCacheDir();

    // Get the monster to determine its current updatedAt timestamp
    const monster = await findPublicMonsterById(monsterId);
    if (!monster) return;

    // Clean up old cached images for this monster
    await cleanupOldImages(monsterId);

    // Generate filename with monster ID and updated timestamp
    // Handle updatedAt as Date object
    const timestamp =
      monster.updatedAt instanceof Date
        ? monster.updatedAt.getTime().toString()
        : new Date(monster.updatedAt).getTime().toString();
    const filename = getCacheFilename(monsterId, timestamp);

    // Write the image to the cache
    await fs.writeFile(filename, imageData);
  } catch (error) {
    console.error(`Error caching monster image: ${error}`);
  }
}

/**
 * Remove old cached images for a monster
 * @param monsterId The monster ID
 */
async function cleanupOldImages(monsterId: string): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR);

    // Find files that match the monster ID pattern
    const matchingFiles = files.filter(
      (file) => file.startsWith(`${monsterId}_`) && file.endsWith(".png"),
    );

    // Delete all matching files
    await Promise.all(
      matchingFiles.map((file) =>
        fs.unlink(path.join(CACHE_DIR, file)).catch(() => {}),
      ),
    );
  } catch {
    // Ignore errors during cleanup
  }
}
