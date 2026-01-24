import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface BlobStorageResult {
  url: string;
  downloadUrl: string;
}

const LOCAL_BLOB_DIR = join(process.cwd(), "public", "blob-storage");

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3;
    const region = process.env.AWS_REGION;

    if (!endpoint || !region) {
      throw new Error(
        "AWS_ENDPOINT_URL_S3 and AWS_REGION environment variables are required"
      );
    }

    s3Client = new S3Client({
      region,
      endpoint,
    });
  }

  return s3Client;
}

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
  const bucket = process.env.BUCKET_NAME;
  const isLocal = process.env.NODE_ENV === "development" || !bucket;

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

  try {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      })
    );

    const url = `https://${bucket}.fly.storage.tigris.dev/${filename}`;
    return {
      url,
      downloadUrl: url,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload blob to Tigris: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function generateBlobFilename(
  entityType: "monster" | "companion" | "item",
  entityId: string,
  version: string
): string {
  return `${entityType}-${entityId}-${version}.png`;
}
