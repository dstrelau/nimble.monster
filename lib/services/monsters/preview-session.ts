import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { JSONAPIFamily, JSONAPIMonster } from "@/lib/api/monsters";
import type { OfficialMonstersSource } from "./official";

const LOCAL_DIR = join(process.cwd(), "tmp", "preview-sessions");

export interface PreviewSessionData {
  monsters: JSONAPIMonster[];
  families: [string, JSONAPIFamily][];
  source?: OfficialMonstersSource;
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

function getKey(sessionKey: string): string {
  return `preview-sessions/${sessionKey}.json`;
}

export async function writePreviewSession(
  sessionKey: string,
  data: {
    monsters: JSONAPIMonster[];
    families: Map<string, JSONAPIFamily>;
    source?: OfficialMonstersSource;
  }
): Promise<void> {
  const sessionData: PreviewSessionData = {
    monsters: data.monsters,
    families: Array.from(data.families.entries()),
    source: data.source,
    createdAt: Date.now(),
  };

  const json = JSON.stringify(sessionData);

  if (isLocal()) {
    const filePath = join(LOCAL_DIR, `${sessionKey}.json`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, json);
    return;
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME,
      Key: getKey(sessionKey),
      Body: json,
      ContentType: "application/json",
    })
  );
}

export async function readPreviewSession(
  sessionKey: string
): Promise<PreviewSessionData | null> {
  let json: string;

  if (isLocal()) {
    try {
      json = await readFile(join(LOCAL_DIR, `${sessionKey}.json`), "utf-8");
    } catch {
      return null;
    }
  } else {
    try {
      const response = await getS3Client().send(
        new GetObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME,
          Key: getKey(sessionKey),
        })
      );
      if (!response.Body) return null;
      json = await response.Body.transformToString();
    } catch {
      return null;
    }
  }

  const data = JSON.parse(json) as PreviewSessionData;

  const maxAge = 15 * 60 * 1000;
  if (Date.now() - data.createdAt > maxAge) {
    await deletePreviewSession(sessionKey);
    return null;
  }

  return data;
}

export async function deletePreviewSession(sessionKey: string): Promise<void> {
  if (isLocal()) {
    try {
      await rm(join(LOCAL_DIR, `${sessionKey}.json`));
    } catch {
      // Ignore
    }
    return;
  }

  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_BUCKET_NAME,
        Key: getKey(sessionKey),
      })
    );
  } catch {
    // Ignore
  }
}
