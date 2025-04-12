import fs from "fs/promises";
import path from "path";
import os from "os";
import { ImageStorageAdapter } from "./adapter";

/**
 * Filesystem implementation of the ImageStorageAdapter
 */
export class FilesystemImageStorage implements ImageStorageAdapter {
  private cacheDir: string;
  private metadataDir: string;

  /**
   * Create a new FilesystemImageStorage
   * @param baseDir Optional base directory for storage (defaults to a temp directory)
   */
  constructor(baseDir?: string) {
    // Use provided directory or create a temp directory
    this.cacheDir = baseDir || path.join(os.tmpdir(), "nimble-monster-images");
    this.metadataDir = path.join(this.cacheDir, "metadata");
  }

  /**
   * Initialize the cache directories
   * @returns A promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Create cache directory if it doesn't exist
    await fs.mkdir(this.cacheDir, { recursive: true });
    await fs.mkdir(this.metadataDir, { recursive: true });
  }

  /**
   * Get the file path for an image with the given key
   * @param key The unique identifier for the image
   * @returns The path to the image file
   */
  private getImagePath(key: string): string {
    return path.join(this.cacheDir, `${key}.png`);
  }

  /**
   * Get the file path for metadata with the given key
   * @param key The unique identifier for the metadata
   * @returns The path to the metadata file
   */
  private getMetadataPath(key: string): string {
    return path.join(this.metadataDir, `${key}.json`);
  }

  /**
   * Store an image in the cache
   * @param key The unique identifier for the image
   * @param data The image data as a Buffer
   * @param metadata Optional metadata to store with the image
   * @returns A promise that resolves when the image is stored
   */
  async storeImage(
    key: string,
    data: Buffer,
    metadata?: Record<string, Date>,
  ): Promise<void> {
    await this.initialize();

    // Write image to disk
    await fs.writeFile(this.getImagePath(key), data);

    // Store metadata if provided
    if (metadata) {
      await fs.writeFile(
        this.getMetadataPath(key),
        JSON.stringify({ ...metadata, createdAt: new Date().toISOString() }),
      );
    }
  }

  /**
   * Retrieve an image from the cache if it exists
   * @param key The unique identifier for the image
   * @param validation Optional function to validate if cached image is still valid
   * @returns A promise that resolves to the image data as a Buffer, or null if not found/invalid
   */
  async retrieveImage(
    key: string,
    validation?: (metadata?: Record<string, Date>) => Promise<boolean>,
  ): Promise<Buffer | null> {
    // Check if image exists and is valid before retrieving
    const isValid = await this.hasValidImage(key, validation);
    if (!isValid) return null;

    // Read and return the image data
    return fs.readFile(this.getImagePath(key));
  }

  /**
   * Check if an image exists in the cache and is valid
   * @param key The unique identifier for the image
   * @param validation Optional function to validate if cached image is still valid
   * @returns A promise that resolves to true if the image exists and is valid, false otherwise
   */
  async hasValidImage(
    key: string,
    validation?: (metadata?: Record<string, Date>) => Promise<boolean>,
  ): Promise<boolean> {
    try {
      // Check if the image file exists
      await fs.access(this.getImagePath(key));

      // If no validation function is provided, the image is valid if it exists
      if (!validation) return true;

      // Otherwise, retrieve metadata and validate
      try {
        const metadataPath = this.getMetadataPath(key);
        await fs.access(metadataPath);

        const metadataContent = await fs.readFile(metadataPath, "utf-8");
        const metadata = JSON.parse(metadataContent);

        // Run validation function
        return await validation(metadata);
      } catch {
        // If metadata doesn't exist or can't be parsed, image is invalid
        return false;
      }
    } catch {
      // Image doesn't exist
      return false;
    }
  }
}
