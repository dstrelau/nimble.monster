#!/usr/bin/env ts-node

import "dotenv/config";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
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
  size: number,
  force: boolean
): Promise<"exists" | "uploaded"> {
  const key = `paperforge/${folder}/${size}.png`;

  if (!force) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
      return "exists";
    } catch {
      // Object doesn't exist, proceed with upload
    }
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
  console.log(`  ↑ ${key}`);
  return "uploaded";
}

async function uploadToTigris(
  localDir: string,
  folder: string,
  force: boolean
): Promise<{ success: boolean; uploaded: number; skipped: number }> {
  try {
    const results = await Promise.all(
      IMAGE_SIZES.map((size) => uploadSingleSize(localDir, folder, size, force))
    );
    const uploaded = results.filter((r) => r === "uploaded").length;
    const skipped = results.filter((r) => r === "exists").length;
    return { success: true, uploaded, skipped };
  } catch (e) {
    console.error(
      `  Error uploading to Tigris:`,
      e instanceof Error ? e.message : String(e)
    );
    return { success: false, uploaded: 0, skipped: 0 };
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
  entries: Array<{ folder: string; outputDir: string }>,
  force: boolean
): Promise<{ uploaded: number; skipped: number; failed: number }> {
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  const batchResults = await processInBatches(entries, async ({ folder, outputDir }) => {
    const result = await uploadToTigris(outputDir, folder, force);
    return { folder, ...result };
  });

  for (const { success, uploaded, skipped } of batchResults) {
    if (success) {
      totalUploaded += uploaded;
      totalSkipped += skipped;
    } else {
      totalFailed++;
    }
  }

  return { uploaded: totalUploaded, skipped: totalSkipped, failed: totalFailed };
}

const shouldUpload = process.argv.includes("--upload");
const shouldVerify = process.argv.includes("--verify");
const shouldVerifyRemote = process.argv.includes("--verify-remote");
const forceUpload = process.argv.includes("--force");

interface CatalogEntry {
  id: string;
  name: string;
  folder: string;
}

function parseCatalog(): CatalogEntry[] {
  const content = fs.readFileSync(INDEX_PATH, "utf-8");
  const entries: CatalogEntry[] = [];
  const regex = /\{\s*id:\s*"(\d+)",\s*name:\s*"([^"]+)",[^}]*folder:\s*"(\d+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    entries.push({ id: match[1], name: match[2], folder: match[3] });
  }
  return entries;
}

type VerifyResult = "match" | "mismatch" | "missing-remote" | "missing-local";

async function verifySizeContent(folder: string, size: number): Promise<VerifyResult> {
  const key = `paperforge/${folder}/${size}.png`;
  const localPath = path.join(OUTPUT_DIR, folder, `${size}.png`);

  if (!fs.existsSync(localPath)) {
    return "missing-local";
  }

  const localBuffer = fs.readFileSync(localPath);
  const localMd5 = createHash("md5").update(localBuffer).digest("hex");

  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    const remoteEtag = head.ETag?.replace(/"/g, "");
    return localMd5 === remoteEtag ? "match" : "mismatch";
  } catch {
    return "missing-remote";
  }
}

interface VerifyEntryResult {
  entry: CatalogEntry;
  mismatches: number[];
  missingRemote: number[];
  missingLocal: number[];
}

async function verifyEntry(entry: CatalogEntry): Promise<VerifyEntryResult> {
  const results = await Promise.all(
    IMAGE_SIZES.map(async (size) => ({ size, result: await verifySizeContent(entry.folder, size) }))
  );
  return {
    entry,
    mismatches: results.filter((r) => r.result === "mismatch").map((r) => r.size),
    missingRemote: results.filter((r) => r.result === "missing-remote").map((r) => r.size),
    missingLocal: results.filter((r) => r.result === "missing-local").map((r) => r.size),
  };
}

async function verifyUploads() {
  const entries = parseCatalog();
  console.log(`Verifying ${entries.length} catalog entries in Tigris...`);

  const results = await processInBatches(entries, verifyEntry);

  const hasIssue = (r: VerifyEntryResult) =>
    r.mismatches.length > 0 || r.missingRemote.length > 0 || r.missingLocal.length > 0;
  const failures = results.filter(hasIssue);

  if (failures.length === 0) {
    console.log(`All ${entries.length} entries verified.`);
    return;
  }

  console.log(`\n=== Verification Failures ===`);
  for (const { entry, mismatches, missingRemote, missingLocal } of failures) {
    const issues: string[] = [];
    if (mismatches.length > 0) issues.push(`mismatch: ${mismatches.join(", ")}`);
    if (missingRemote.length > 0) issues.push(`missing remote: ${missingRemote.join(", ")}`);
    if (missingLocal.length > 0) issues.push(`missing local: ${missingLocal.join(", ")}`);
    console.log(`  #${entry.id} ${entry.name}: ${issues.join("; ")}`);
  }
  console.log(`\n${failures.length} entries with issues.`);
  process.exit(1);
}

let firstErrorLogged = false;
async function checkSizeExists(folder: string, size: number): Promise<boolean> {
  const key = `paperforge/${folder}/${size}.png`;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (e) {
    if (!firstErrorLogged) {
      firstErrorLogged = true;
      console.log(`First check failed: ${BUCKET_NAME}/${key}`);
      console.log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    return false;
  }
}

async function verifyEntryRemote(entry: CatalogEntry): Promise<{ entry: CatalogEntry; missing: number[] }> {
  const results = await Promise.all(
    IMAGE_SIZES.map(async (size) => ({ size, exists: await checkSizeExists(entry.folder, size) }))
  );
  return { entry, missing: results.filter((r) => !r.exists).map((r) => r.size) };
}

async function verifyRemoteUploads() {
  const entries = parseCatalog();
  console.log(`Endpoint: ${process.env.AWS_ENDPOINT_URL_S3 ?? "(not set)"}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Verifying ${entries.length} catalog entries exist in Tigris...`);

  const results = await processInBatches(entries, verifyEntryRemote);
  const failures = results.filter((r) => r.missing.length > 0);

  if (failures.length === 0) {
    console.log(`All ${entries.length} entries verified.`);
    return;
  }

  console.log(`\n=== Missing Images ===`);
  for (const { entry, missing } of failures) {
    console.log(`  #${entry.id} ${entry.name}: missing sizes ${missing.join(", ")}`);
  }
  console.log(`\n${failures.length} entries with missing images.`);
  process.exit(1);
}

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
    const alreadyExists = fs.existsSync(path.join(outputDir, "400.png"));

    // Skip silently if already processed (unless single ID mode)
    if (alreadyExists && !singleId) {
      return { status: "existing" };
    }

    // In single ID mode (without force) with existing images, return success for upload
    if (alreadyExists && singleId && !forceUpload) {
      return {
        status: "success",
        id: row.id,
        name: row.name,
        postUrl: row.postUrl,
        folder: folderId,
        outputDir,
      };
    }
    // With --force, fall through to re-download and re-extract

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

    if (!fs.existsSync(zipPath) || forceUpload) {
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

  // Upload to Tigris in parallel batches
  if (shouldUpload && entriesWithPortraits.length > 0) {
    const entriesToUpload = singleId
      ? entriesWithPortraits.filter((row) => row.id === singleId)
      : entriesWithPortraits;
    const toUpload = entriesToUpload.map((row) => {
      const folderId = row.id.padStart(4, "0");
      return { folder: folderId, outputDir: path.join(OUTPUT_DIR, folderId), id: row.id, name: row.name };
    });
    console.log(`\nUploading ${toUpload.length} entries to Tigris...`);
    const { uploaded, skipped, failed } = await uploadAllToTigris(toUpload, forceUpload);
    console.log(`Uploaded: ${uploaded} new, ${skipped} skipped, ${failed} failed`);
  }

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

if (shouldVerifyRemote) {
  verifyRemoteUploads();
} else if (shouldVerify) {
  verifyUploads();
} else {
  const singleId = process.argv.filter((a) => !a.startsWith("--"))[2];
  if (forceUpload && !singleId) {
    console.error("--force requires a single ID");
    process.exit(1);
  }
  syncPaperforge(singleId);
}
