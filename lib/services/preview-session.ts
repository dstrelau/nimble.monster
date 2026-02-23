import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const LOCAL_DIR = join(process.cwd(), "tmp", "preview-sessions");

export interface PreviewSessionData<T> {
  data: T;
  createdAt: number;
}

function isLocal(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    !process.env.NEXT_PUBLIC_BUCKET_NAME
  );
}

function getS3Client(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  if (!endpoint || !region) {
    throw new Error("AWS_ENDPOINT_URL_S3 and AWS_REGION required");
  }
  return new S3Client({ region, endpoint });
}

function getKey(prefix: string, sessionKey: string): string {
  return `preview-sessions/${prefix}/${sessionKey}.json`;
}

export async function writePreviewSession<T>(
  prefix: string,
  sessionKey: string,
  data: T
): Promise<void> {
  const sessionData: PreviewSessionData<T> = {
    data,
    createdAt: Date.now(),
  };

  const json = JSON.stringify(sessionData);

  if (isLocal()) {
    const filePath = join(LOCAL_DIR, prefix, `${sessionKey}.json`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, json);
    return;
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME,
      Key: getKey(prefix, sessionKey),
      Body: json,
      ContentType: "application/json",
    })
  );
}

export async function readPreviewSession<T>(
  prefix: string,
  sessionKey: string
): Promise<T | null> {
  let json: string;

  if (isLocal()) {
    try {
      json = await readFile(
        join(LOCAL_DIR, prefix, `${sessionKey}.json`),
        "utf-8"
      );
    } catch {
      return null;
    }
  } else {
    try {
      const response = await getS3Client().send(
        new GetObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME,
          Key: getKey(prefix, sessionKey),
        })
      );
      if (!response.Body) return null;
      json = await response.Body.transformToString();
    } catch {
      return null;
    }
  }

  const sessionData = JSON.parse(json) as PreviewSessionData<T>;

  const maxAge = 15 * 60 * 1000;
  if (Date.now() - sessionData.createdAt > maxAge) {
    await deletePreviewSession(prefix, sessionKey);
    return null;
  }

  return sessionData.data;
}

export async function deletePreviewSession(
  prefix: string,
  sessionKey: string
): Promise<void> {
  if (isLocal()) {
    try {
      await rm(join(LOCAL_DIR, prefix, `${sessionKey}.json`));
    } catch {
      // Ignore
    }
    return;
  }

  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME,
        Key: getKey(prefix, sessionKey),
      })
    );
  } catch {
    // Ignore
  }
}
