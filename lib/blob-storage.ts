import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";

export interface BlobStorageResult {
  url: string;
  downloadUrl: string;
}

const LOCAL_BLOB_DIR = join(process.cwd(), "public", "blob-storage");

async function ensureLocalBlobDir(): Promise<void> {
  if (!existsSync(LOCAL_BLOB_DIR)) {
    await mkdir(LOCAL_BLOB_DIR, { recursive: true });
  }
}

export async function uploadBlob(
  filename: string,
  buffer: Buffer,
  contentType: string = "image/png"
): Promise<BlobStorageResult> {
  const isLocal =
    process.env.NODE_ENV === "development" ||
    !process.env.BLOB_READ_WRITE_TOKEN;

  if (isLocal) {
    await ensureLocalBlobDir();
    const filePath = join(LOCAL_BLOB_DIR, filename);
    await writeFile(filePath, buffer);

    const localUrl = `/blob-storage/${filename}`;
    return {
      url: localUrl,
      downloadUrl: localUrl,
    };
  }

  const blob = await put(filename, buffer, {
    access: "public",
    contentType,
  });

  return {
    url: blob.url,
    downloadUrl: blob.downloadUrl,
  };
}

// Note: downloadBlob function removed - we now redirect to blob URLs directly
// instead of streaming through our app. If needed for other use cases,
// this function can be restored.

export function generateBlobFilename(
  entityType: "monster" | "companion" | "item",
  entityId: string,
  version: string
): string {
  return `${entityType}-${entityId}-${version}.png`;
}
