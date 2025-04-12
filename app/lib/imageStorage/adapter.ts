/**
 * Generic image storage adapter interface
 */
export interface ImageStorageAdapter {
  /**
   * Store an image in the cache
   * @param key The unique identifier for the image
   * @param data The image data as a Buffer
   * @param metadata Optional metadata to store with the image
   * @returns A promise that resolves when the image is stored
   */
  storeImage(
    key: string,
    data: Buffer,
    metadata?: Record<string, Date>,
  ): Promise<void>;

  /**
   * Retrieve an image from the cache if it exists
   * @param key The unique identifier for the image
   * @param validation Optional function to validate if cached image is still valid
   * @returns A promise that resolves to the image data as a Buffer, or null if not found/invalid
   */
  retrieveImage(
    key: string,
    validation?: (metadata?: Record<string, Date>) => Promise<boolean>,
  ): Promise<Buffer | null>;

  /**
   * Check if an image exists in the cache and is valid
   * @param key The unique identifier for the image
   * @param validation Optional function to validate if cached image is still valid
   * @returns A promise that resolves to true if the image exists and is valid, false otherwise
   */
  hasValidImage(
    key: string,
    validation?: (metadata?: Record<string, Date>) => Promise<boolean>,
  ): Promise<boolean>;
}
