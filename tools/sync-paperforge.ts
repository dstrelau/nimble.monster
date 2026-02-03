#!/usr/bin/env ts-node

import "dotenv/config";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import AdmZip from "adm-zip";
import sharp from "sharp";

const CSV_PATH = "data/paperforge.csv";
const PAPERFORGE_DIR = "data/paperforge";
const OUTPUT_DIR = "public/paperforge";
const INDEX_PATH = "lib/paperforge-catalog.ts";

const BUCKET_NAME = process.env.NEXT_PUBLIC_BUCKET_NAME || "nimble-nexus";
const IMAGE_SIZES = [50, 100, 200, 400];

const s3 = new S3Client({});

function getExistingCatalogIds(): Set<string> {
  try {
    const content = fs.readFileSync(INDEX_PATH, "utf-8");
    const ids = new Set<string>();
    const regex = /id:\s*"(\d+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      ids.add(match[1]);
    }
    return ids;
  } catch {
    return new Set();
  }
}

async function uploadSingleSize(
  localDir: string,
  folder: string,
  size: number
): Promise<boolean> {
  const key = `paperforge/${folder}/${size}.png`;

  // Check if already exists
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    // Object doesn't exist, proceed with upload
  }

  const localPath = path.join(localDir, `${size}.png`);
  const buffer = fs.readFileSync(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    })
  );
  return true;
}

async function uploadToTigris(
  localDir: string,
  folder: string
): Promise<boolean> {
  try {
    await Promise.all(
      IMAGE_SIZES.map((size) => uploadSingleSize(localDir, folder, size))
    );
    return true;
  } catch (e) {
    console.error(
      `  Error uploading to Tigris:`,
      e instanceof Error ? e.message : String(e)
    );
    return false;
  }
}

const CONCURRENCY = 10;

async function processInBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

async function uploadAllToTigris(
  entries: Array<{ folder: string; outputDir: string }>
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const batchResults = await processInBatches(entries, async ({ folder, outputDir }) => {
    const success = await uploadToTigris(outputDir, folder);
    return { folder, success };
  });
  for (const { folder, success } of batchResults) {
    results.set(folder, success);
  }
  return results;
}

const shouldUpload = process.argv.includes("--upload");

interface CSVRow {
  id: string;
  name: string;
  postUrl: string;
  tokenDownloadUrl: string;
  tokenPng: string;
}

type ProcessResult =
  | { status: "skipped" }
  | { status: "existing" }
  | { status: "success"; id: string; name: string; postUrl: string; folder: string; outputDir: string; csvUpdate?: string }
  | { status: "error"; id: string; name: string; reason: string };

function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split("\n");

  return lines
    .slice(1)
    .map((line) => {
      if (!line.trim()) return null;
      const [id, name, postUrl, tokenDownloadUrl, tokenPng] = line
        .split(",")
        .map((s) => s.trim());
      return { id, name, postUrl, tokenDownloadUrl, tokenPng };
    })
    .filter(Boolean) as CSVRow[];
}

function downloadZipFile(url: string, destinationDir: string): boolean {
  try {
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const result = execSync(
      `curl -sOJL --clobber -w '\\n%{http_code}' ${escapeShellArg(url)}`,
      {
        cwd: destinationDir,
        encoding: "utf-8",
      }
    );

    const httpCode = result.trim().split("\n").pop();
    if (httpCode && !httpCode.startsWith("2")) {
      console.error(`  HTTP ${httpCode} downloading ${url}`);
      return false;
    }

    return true;
  } catch (e) {
    console.error(
      `  Error downloading ${url}:`,
      e instanceof Error ? e.message : String(e)
    );
    return false;
  }
}

async function extractTokenImage(
  zipPath: string,
  internalPath: string,
  outputDir: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry(internalPath);

    if (!entry) {
      console.error(`  Entry not found in zip: ${internalPath}`);
      console.error(`  Available entries:`);
      for (const e of zip.getEntries()) {
        if (!e.isDirectory) {
          console.error(`    ${e.entryName}`);
        }
      }
      return false;
    }

    const originalBuffer = entry.getData();

    // Generate all sizes locally
    for (const size of IMAGE_SIZES) {
      const resizedBuffer = await sharp(originalBuffer)
        .ensureAlpha()
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      fs.writeFileSync(path.join(outputDir, `${size}.png`), resizedBuffer);
    }

    return true;
  } catch (e) {
    console.error(
      `  Error extracting ${internalPath}:`,
      e instanceof Error ? e.message : e
    );
    return false;
  }
}

function generateIndex(
  entries: Array<{ id: string; name: string; postUrl: string }>
) {
  const entriesString = entries
    .map((e) => {
      const folder = e.id.padStart(4, "0");
      const parts = [
        `    id: ${JSON.stringify(e.id)},`,
        `    name: ${JSON.stringify(e.name)},`,
      ];
      if (e.postUrl) {
        parts.push(`    postUrl: ${JSON.stringify(e.postUrl)},`);
      }
      parts.push(`    folder: ${JSON.stringify(folder)},`);
      return `  {\n${parts.join("\n")}\n  }`;
    })
    .join(",\n");

  const content = `// Auto-generated by tools/sync-paperforge.ts
// Do not edit manually

export interface PaperForgeEntry {
  id: string;
  name: string;
  postUrl?: string;
  folder: string;
}

export const PAPERFORGE_ENTRIES: PaperForgeEntry[] = [
${entriesString},
];

export function getPaperforgeEntry(identifier: string): PaperForgeEntry | null {
  // Try by ID first
  const byId = PAPERFORGE_ENTRIES.find((e) => e.id === identifier);
  if (byId) return byId;

  // Try by name (case-insensitive)
  const byName = PAPERFORGE_ENTRIES.find(
    (e) => e.name.toLowerCase() === identifier.toLowerCase()
  );
  if (byName) return byName;

  return null;
}
`;

  fs.writeFileSync(INDEX_PATH, content);
  console.log(`\nGenerated index at ${INDEX_PATH}`);
}

async function syncPaperforge(singleId?: string) {
  const existingIds = getExistingCatalogIds();
  const content = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(content);

  // Filter to rows with at least id, name, and postUrl
  let completeRows = rows.filter((row) => row.id && row.name && row.postUrl);

  if (singleId) {
    completeRows = completeRows.filter((row) => row.id === singleId);
    if (completeRows.length === 0) {
      console.error(`No entry found with id: ${singleId}`);
      process.exit(1);
    }
  }

  // Check for duplicate IDs
  const idCounts = new Map<string, number>();
  const duplicateIds: string[] = [];

  for (const row of completeRows) {
    const count = (idCounts.get(row.id) || 0) + 1;
    idCounts.set(row.id, count);
    if (count === 2) {
      duplicateIds.push(row.id);
    }
  }

  if (duplicateIds.length > 0) {
    console.error("\n❌ ERROR: Duplicate IDs found in complete entries:");
    for (const id of duplicateIds) {
      const entries = completeRows.filter((r) => r.id === id);
      console.error(`  ID ${id}:`);
      for (const entry of entries) {
        console.error(`    - ${entry.name} (${entry.postUrl})`);
      }
    }
    process.exit(1);
  }

  async function processRow(row: CSVRow): Promise<ProcessResult> {
    const folderId = row.id.padStart(4, "0");
    const outputDir = path.join(OUTPUT_DIR, folderId);

    // Skip silently if already processed
    if (fs.existsSync(path.join(outputDir, "400.png"))) {
      return { status: "existing" };
    }

    // Skip silently if no download available
    if (
      (!row.tokenPng || row.tokenPng === "-") &&
      (!row.tokenDownloadUrl || row.tokenDownloadUrl === "-")
    ) {
      return { status: "skipped" };
    }

    // If tokenPng is missing but downloadUrl exists - try to auto-detect
    let csvUpdate: string | undefined;
    if (
      (!row.tokenPng || row.tokenPng === "-") &&
      row.tokenDownloadUrl &&
      row.tokenDownloadUrl !== "-"
    ) {
      const downloaded = downloadZipFile(row.tokenDownloadUrl, PAPERFORGE_DIR);

      if (downloaded) {
        const files = fs
          .readdirSync(PAPERFORGE_DIR)
          .filter((f) => f.endsWith(".zip"));
        const latestZip = files
          .map((f) => ({
            name: f,
            time: fs.statSync(path.join(PAPERFORGE_DIR, f)).mtime,
          }))
          .sort((a, b) => b.time.getTime() - a.time.getTime())[0];

        if (latestZip) {
          const zipPath = path.join(PAPERFORGE_DIR, latestZip.name);
          const zip = new AdmZip(zipPath);

          const entries = zip
            .getEntries()
            .filter((e) => !e.isDirectory && e.entryName.endsWith(".png"));
          const portraitEntry =
            entries.find((e) => /Portrait\/[^/]+\.png$/i.test(e.entryName)) ||
            entries.find((e) => /Portrait[^/]*\.png$/i.test(e.entryName));

          if (portraitEntry) {
            row.tokenPng = `${latestZip.name}/${portraitEntry.entryName}`;
            csvUpdate = row.tokenPng;
          } else {
            return {
              status: "error",
              id: row.id,
              name: row.name,
              reason: `No portrait image found in ${latestZip.name}`,
            };
          }
        }
      } else {
        return {
          status: "error",
          id: row.id,
          name: row.name,
          reason: "Failed to download zip file",
        };
      }
    }

    if (!row.tokenPng || row.tokenPng === "-") {
      return {
        status: "error",
        id: row.id,
        name: row.name,
        reason: "No tokenPng path specified",
      };
    }

    const [zipFilename, ...pathParts] = row.tokenPng.split("/");
    const internalPath = pathParts.join("/");
    const zipPath = path.join(PAPERFORGE_DIR, zipFilename);

    if (!fs.existsSync(zipPath)) {
      if (row.tokenDownloadUrl) {
        const downloaded = downloadZipFile(row.tokenDownloadUrl, PAPERFORGE_DIR);
        if (!downloaded || !fs.existsSync(zipPath)) {
          return {
            status: "error",
            id: row.id,
            name: row.name,
            reason: "Failed to download zip file",
          };
        }
      } else {
        return {
          status: "error",
          id: row.id,
          name: row.name,
          reason: "No download URL available",
        };
      }
    }

    const success = await extractTokenImage(zipPath, internalPath, outputDir);
    if (success) {
      return {
        status: "success",
        id: row.id,
        name: row.name,
        postUrl: row.postUrl,
        folder: folderId,
        outputDir,
        csvUpdate,
      };
    }
    return {
      status: "error",
      id: row.id,
      name: row.name,
      reason: "Failed to extract image from zip",
    };
  }

  const results = await processInBatches(completeRows, processRow);

  const successes = results.filter((r) => r.status === "success") as Extract<ProcessResult, { status: "success" }>[];
  const failures = results.filter((r) => r.status === "error") as Extract<ProcessResult, { status: "error" }>[];

  for (const s of successes) {
    console.log(`✓ #${s.id} ${s.name}`);
  }

  const csvUpdates = successes.filter((s) => s.csvUpdate);
  const csvUpdated = csvUpdates.length > 0;
  for (const update of csvUpdates) {
    const row = rows.find((r) => r.id === update.id);
    if (row) row.tokenPng = update.csvUpdate!;
  }

  const indexEntries = successes.map((s) => ({ id: s.id, name: s.name, postUrl: s.postUrl }));
  const toUpload = shouldUpload
    ? successes.map((s) => ({ folder: s.folder, outputDir: s.outputDir, id: s.id, name: s.name }))
    : [];

  // Upload to Tigris in parallel batches
  if (toUpload.length > 0) {
    console.log(`\nUploading ${toUpload.length} entries to Tigris...`);
    const uploadResults = await uploadAllToTigris(toUpload);
    let uploadSuccess = 0;
    let uploadFailed = 0;
    for (const { folder, id, name } of toUpload) {
      if (uploadResults.get(folder)) {
        uploadSuccess++;
      } else {
        uploadFailed++;
        console.log(`  ✗ #${id} ${name}: upload failed`);
      }
    }
    console.log(`Uploaded: ${uploadSuccess} success, ${uploadFailed} failed`);
  }

  // Generate index from all entries that have portraits in public/
  const allCompleteRows = rows.filter(
    (row) => row.id && row.name && row.postUrl
  );
  const entriesWithPortraits = allCompleteRows.filter((row) => {
    const folderId = row.id.padStart(4, "0");
    return fs.existsSync(path.join(OUTPUT_DIR, folderId, "400.png"));
  });
  const newlyAdded = entriesWithPortraits.filter(
    (row) => !existingIds.has(row.id)
  ).length;
  if (indexEntries.length > 0 || singleId) {
    generateIndex(
      entriesWithPortraits.map((row) => ({
        id: row.id,
        name: row.name,
        postUrl: row.postUrl,
      }))
    );
  }

  // Write updated CSV if needed
  if (csvUpdated) {
    const header = "id,name,postUrl,tokenDownloadUrl,tokenPng";
    const csvLines = [
      header,
      ...rows.map((row) =>
        [
          row.id,
          row.name,
          row.postUrl,
          row.tokenDownloadUrl,
          row.tokenPng,
        ].join(",")
      ),
    ];
    fs.writeFileSync(CSV_PATH, `${csvLines.join("\n")}\n`);
    console.log(`\n✓ Updated CSV with new zip filenames`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${successes.length} extracted, ${failures.length} errors`);
  console.log(`Newly added to catalog: ${newlyAdded}`);
  console.log(`Total entries in catalog: ${entriesWithPortraits.length}`);

  if (failures.length > 0) {
    console.log(`\n=== Failures ===`);
    for (const failure of failures) {
      console.log(`  #${failure.id} ${failure.name}: ${failure.reason}`);
    }
    process.exit(1);
  }
}

const singleId = process.argv.filter((a) => !a.startsWith("--"))[2];
syncPaperforge(singleId);
