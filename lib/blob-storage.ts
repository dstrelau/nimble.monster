import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface BlobStorageResult {
  url: string;
  downloadUrl: string;
}

const LOCAL_BLOB_DIR = join(process.cwd(), "public", "blob-storage");
const S3_REGION = "us-east-1";

function getConfig() {
  const datacenter = process.env.DO_SPACES_DATACENTER || "nyc3";
  const bucket = process.env.DO_SPACES_BUCKET || "nimble-nexus";
  const endpoint = `https://${datacenter}.digitaloceanspaces.com`;
  const cdnUrl =
    process.env.DO_SPACES_CDN_URL ||
    `https://${bucket}.${datacenter}.digitaloceanspaces.com`;

  return { datacenter, bucket, endpoint, cdnUrl };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accessKeyId = process.env.DO_SPACES_ACCESS_KEY;
    const secretAccessKey = process.env.DO_SPACES_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "DO_SPACES_ACCESS_KEY and DO_SPACES_SECRET_KEY environment variables are required"
      );
    }

    const { endpoint } = getConfig();

    s3Client = new S3Client({
      region: S3_REGION,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
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
  const isLocal =
    process.env.NODE_ENV === "development" || !process.env.DO_SPACES_ACCESS_KEY;

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
    const { bucket, cdnUrl } = getConfig();
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

    const url = `${cdnUrl}/${filename}`;
    return {
      url,
      downloadUrl: url,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload blob to DigitalOcean Spaces: ${error instanceof Error ? error.message : String(error)}`
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
