import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
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

export async function uploadBlob(
  filename: string,
  buffer: Buffer,
  contentType: string = "image/png"
): Promise<BlobStorageResult> {
  const bucket = process.env.NEXT_PUBLIC_BUCKET_NAME;
  const isLocal = process.env.NODE_ENV === "development" || !bucket;

  if (isLocal) {
    const filePath = join(LOCAL_BLOB_DIR, filename);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);

    const localUrl = `/blob-storage/${filename}`;
    return {
      url: localUrl,
      downloadUrl: localUrl,
    };
  }

  const UPLOAD_TIMEOUT_MS = 10_000;
  const UPLOAD_MAX_ATTEMPTS = 3;
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  });

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt++) {
    try {
      await client.send(command, {
        abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });

      const url = `https://${bucket}.fly.storage.tigris.dev/${filename}`;
      return {
        url,
        downloadUrl: url,
      };
    } catch (error) {
      if (attempt === UPLOAD_MAX_ATTEMPTS) {
        throw new Error(
          `Failed to upload blob to Tigris after ${UPLOAD_MAX_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  throw new Error(
    "Failed to upload blob to Tigris: unexpected retry exhaustion"
  );
}

export function generateBlobFilename(
  entityType: "monster" | "companion" | "item",
  entityId: string,
  version: string
): string {
  return `${entityType}-${entityId}-${version}.png`;
}

export function generateEntityImagePath(
  entityType: "monster" | "companion" | "item",
  entityId: string,
  version: string
): string {
  const filename = `${entityType}-${entityId}-${version}.png`;
  return `card-images/${entityType}/${filename}`;
}
