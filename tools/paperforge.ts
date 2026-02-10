#!/usr/bin/env node

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

// --- Constants ---

const LISTING_URL =
  "https://www.paperforgeminis.com/minis?sort=created-old&perPage=60";
const PF_S3_BASE = "https://paperforgedev.s3.us-east-2.amazonaws.com/";
const CATALOG_PATH = "data/paperforge-catalog.json";
const LEGACY_PATH = "data/paperforge-legacy.json";
const PAPERFORGE_DIR = "data/paperforge";
const OUTPUT_DIR = "public/paperforge";
const INDEX_PATH = "lib/paperforge-catalog.ts";
const BUCKET_NAME = process.env.NEXT_PUBLIC_BUCKET_NAME || "nimble-nexus";
const IMAGE_SIZES = [50, 100, 200, 400];
const CONCURRENCY = 10;

const TIER_MAP: Record<string, { tierName: string; tierNumber: number }> = {
  FREE: { tierName: "Free", tierNumber: 0 },
  COPPER: { tierName: "Copper", tierNumber: 1 },
  IRON: { tierName: "Iron", tierNumber: 2 },
  STEEL: { tierName: "Steel", tierNumber: 3 },
  TITANIUM: { tierName: "Titanium", tierNumber: 4 },
  MITHRIL: { tierName: "Mithril", tierNumber: 8 },
};

// --- Shared types ---

interface CatalogDownload {
  filename: string;
  category: string;
  tier: string;
  tierName: string;
  tierNumber: number;
  filenameTier: string | null;
  url: string;
}

interface CatalogMini {
  id: string;
  number: number | null;
  name: string;
  url: string;
  enabled: boolean;
  releaseDate: string;
  downloads: CatalogDownload[];
}

interface CatalogJSON {
  totalMinis: number;
  s3BaseUrl: string;
  minis: CatalogMini[];
}

interface RawAsset {
  id: string;
  document_file: string;
  tier: string;
  type: string;
  miniId: string;
}

interface RawMini {
  id: string;
  name: string;
  number: number | null;
  enabled: boolean;
  releaseDate: string;
  assets: RawAsset[];
}

// --- SyncMini: unified type for both catalog and legacy entries ---

interface SyncMini {
  miniId: string;
  name: string;
  url: string;
  zipFilename: string;
  downloadUrl: string;
  portraitPath?: string;
}

interface LegacyMini {
  id: string;
  name: string;
  url: string;
  downloadUrl?: string;
  zipFilename: string;
  portraitPath?: string;
}

interface LegacyJSON {
  minis: LegacyMini[];
}

function folderForId(miniId: string): string {
  return miniId.padStart(4, "0");
}

function loadLegacy(): LegacyJSON {
  try {
    const content = fs.readFileSync(LEGACY_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return { minis: [] };
  }
}

function loadAllSyncMinis(): SyncMini[] {
  const catalog = loadCatalog();
  const legacy = loadLegacy();

  const catalogMinis: SyncMini[] = getMinisWithFreeVTT(catalog).map((m) => {
    const vtt = getFreeVTTDownload(m)!;
    return {
      miniId: String(m.number),
      name: m.name,
      url: m.url,
      zipFilename: vtt.filename,
      downloadUrl: vtt.url,
    };
  });

  const catalogIds = new Set(catalogMinis.map((m) => m.miniId));

  const legacyMinis: SyncMini[] = legacy.minis
    .filter((m) => !catalogIds.has(m.id))
    .filter((m) => m.downloadUrl)
    .map((m) => ({
      miniId: m.id,
      name: m.name,
      url: m.url,
      zipFilename: m.zipFilename,
      downloadUrl: m.downloadUrl!,
      portraitPath: m.portraitPath,
    }));

  return [...legacyMinis, ...catalogMinis];
}

function filterSyncMinis(
  minis: SyncMini[],
  filter: string | undefined
): SyncMini[] {
  if (!filter) return minis;
  return minis.filter((m) => m.miniId === filter);
}

// --- Helpers ---

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

function loadCatalog(): CatalogJSON {
  const content = fs.readFileSync(CATALOG_PATH, "utf-8");
  return JSON.parse(content);
}

type NumberedMini = CatalogMini & { number: number };

function getMinisWithFreeVTT(catalog: CatalogJSON): NumberedMini[] {
  return catalog.minis.filter(
    (m): m is NumberedMini =>
      m.number !== null &&
      m.downloads.some((d) => d.category === "vtt" && d.tier === "FREE")
  );
}

function getFreeVTTDownload(mini: CatalogMini): CatalogDownload | undefined {
  return mini.downloads.find((d) => d.category === "vtt" && d.tier === "FREE");
}

function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

// --- Scrape: fetch catalog from paperforgeminis.com ---

function categorizeFile(filename: string): string {
  const fl = filename.toLowerCase();
  if (fl.endsWith(".psd.zip") || fl.includes("_psd")) return "psd";
  if (fl.includes("_vtt")) return "vtt";
  if (
    fl.includes("_cutfile") ||
    fl.includes("_cutifle") ||
    fl.includes("_cutile")
  )
    return "cutfile";
  if (fl.includes("_png") || fl.includes("_hdpng")) return "png";
  if (fl.includes("_pdf") || fl.endsWith(".pdf")) return "pdf";
  return "unknown";
}

function extractTierFromFilename(filename: string): string | null {
  const m = filename.match(/_(FREE|T\d+)_/);
  if (m) return m[1];
  const m2 = filename.match(/_Tier(\d+)/);
  if (m2) return `T${m2[1]}`;
  if (filename.includes("_FREE.")) return "FREE";
  return null;
}

function extractMinisFromHtml(html: string): RawMini[] {
  let bigScript: string | null = null;
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/g;
  for (
    let scriptMatch = scriptRe.exec(html);
    scriptMatch !== null;
    scriptMatch = scriptRe.exec(html)
  ) {
    if (scriptMatch[1].length > 500_000) {
      bigScript = scriptMatch[1];
      break;
    }
  }
  if (!bigScript) {
    throw new Error("Could not find RSC data script tag");
  }

  const pushStart = bigScript.indexOf("self.__next_f.push(");
  if (pushStart === -1) {
    throw new Error("Could not find __next_f.push");
  }

  const argsStart = pushStart + "self.__next_f.push(".length;
  const argsStr = bigScript.slice(argsStart, -1);
  const arr: [number, string] = JSON.parse(argsStr);
  const inner = arr[1];

  const jsonStart = inner.indexOf('{"minis":');
  if (jsonStart === -1) {
    throw new Error("Could not find minis JSON in RSC payload");
  }

  let rest = inner.slice(jsonStart);
  rest = rest.split("$D").join("");

  let depth = 0;
  let objEnd: number | null = null;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "{") depth++;
    else if (rest[i] === "}") {
      depth--;
      if (depth === 0) {
        objEnd = i + 1;
        break;
      }
    }
  }

  if (objEnd === null) {
    throw new Error("Could not find matching brace for minis object");
  }

  const obj = JSON.parse(rest.slice(0, objEnd));
  return obj.minis as RawMini[];
}

function processRawMini(mini: RawMini): CatalogMini {
  let number = mini.number;
  if (number === null) {
    const nameMatch = mini.name.match(/^(\d+)/);
    if (nameMatch) {
      number = parseInt(nameMatch[1], 10);
    }
  }

  const downloads: CatalogDownload[] = [];
  for (const asset of mini.assets ?? []) {
    if (asset.type !== "DOWNLOAD") continue;

    const filename = asset.document_file;
    const category = categorizeFile(filename);
    const tierCode = asset.tier ?? "";
    const tierInfo = TIER_MAP[tierCode] ?? {
      tierName: tierCode,
      tierNumber: -1,
    };
    const filenameTier = extractTierFromFilename(filename);
    const downloadUrl = PF_S3_BASE + encodeURIComponent(filename);

    downloads.push({
      filename,
      category,
      tier: tierCode,
      tierName: tierInfo.tierName,
      tierNumber: tierInfo.tierNumber,
      filenameTier,
      url: downloadUrl,
    });
  }

  downloads.sort((a, b) => {
    if (a.tierNumber !== b.tierNumber) return a.tierNumber - b.tierNumber;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.filename.localeCompare(b.filename);
  });

  return {
    id: mini.id,
    number,
    name: mini.name,
    url: `https://www.paperforgeminis.com/minis/${mini.id}`,
    enabled: mini.enabled ?? true,
    releaseDate: mini.releaseDate,
    downloads,
  };
}

async function cmdScrape() {
  console.log(`Fetching ${LISTING_URL} ...`);
  const resp = await fetch(LISTING_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (paperforge-index-builder)" },
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }
  const html = await resp.text();
  console.log(`  Fetched ${html.length} bytes`);

  const rawMinis = extractMinisFromHtml(html);
  console.log(`Extracted ${rawMinis.length} raw minis`);

  const results = rawMinis.map(processRawMini);
  results.sort((a, b) => (a.number ?? 99999) - (b.number ?? 99999));

  const index = {
    totalMinis: results.length,
    s3BaseUrl: PF_S3_BASE,
    minis: results,
  };

  fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(index, null, 2));

  console.log(`\nWrote ${results.length} minis to ${CATALOG_PATH}`);

  const dlCount = results.reduce((sum, m) => sum + m.downloads.length, 0);
  const cats: Record<string, number> = {};
  for (const m of results) {
    for (const d of m.downloads) {
      cats[d.category] = (cats[d.category] ?? 0) + 1;
    }
  }
  console.log(`Total download files: ${dlCount}`);
  console.log(`Categories: ${JSON.stringify(cats, null, 2)}`);

  const noDl = results.filter((m) => m.downloads.length === 0);
  if (noDl.length > 0) {
    console.log(`Minis without downloads: ${noDl.length}`);
    for (const m of noDl) {
      console.log(`  #${m.number}: ${m.name}`);
    }
  }
}

// --- Download: fetch FREE VTT zip files ---

function downloadFile(url: string, destPath: string): boolean {
  try {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const result = execSync(
      `curl -sL -o ${escapeShellArg(destPath)} -w '%{http_code}' ${escapeShellArg(url)}`,
      { encoding: "utf-8" }
    );

    const httpCode = result.trim();
    if (!httpCode.startsWith("2")) {
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

async function cmdDownload(filter: string | undefined, force: boolean) {
  let minis = loadAllSyncMinis();
  minis = filterSyncMinis(minis, filter);

  if (minis.length === 0) {
    console.error(
      filter ? `No mini found: ${filter}` : "No minis with FREE VTT downloads"
    );
    process.exit(1);
  }

  console.log(`Downloading FREE VTT zips for ${minis.length} minis...`);
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const mini of minis) {
    const zipPath = path.join(PAPERFORGE_DIR, mini.zipFilename);
    if (fs.existsSync(zipPath) && !force) {
      skipped++;
      continue;
    }

    const ok = downloadFile(mini.downloadUrl, zipPath);
    if (ok) {
      console.log(`  ↓ #${mini.miniId} ${mini.name}`);
      downloaded++;
    } else {
      console.error(`  ✗ #${mini.miniId} ${mini.name}`);
      failed++;
    }
  }

  console.log(
    `\nDownloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed}`
  );
  if (failed > 0) process.exit(1);
}

// --- Images: extract portraits and resize ---

async function extractPortraitImage(
  zipPath: string,
  outputDir: string,
  explicitPath?: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zip = new AdmZip(zipPath);

    let portraitEntry;
    if (explicitPath) {
      portraitEntry = zip.getEntry(explicitPath);
      if (!portraitEntry) {
        console.error(`  Entry not found in zip: ${explicitPath}`);
        return false;
      }
    } else {
      const pngEntries = zip
        .getEntries()
        .filter((e) => !e.isDirectory && e.entryName.endsWith(".png"));

      portraitEntry =
        pngEntries.find((e) => /Portrait\/[^/]+\.png$/i.test(e.entryName)) ||
        pngEntries.find((e) => /BaseGold\.png$/i.test(e.entryName)) ||
        pngEntries.find((e) => /Portrait[^/]*\.png$/i.test(e.entryName)) ||
        pngEntries[0];

      if (!portraitEntry) {
        console.error(`  No portrait image found in ${zipPath}`);
        for (const e of pngEntries) {
          console.error(`    ${e.entryName}`);
        }
        return false;
      }
    }

    const originalBuffer = portraitEntry.getData();

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
      `  Error extracting from ${zipPath}:`,
      e instanceof Error ? e.message : e
    );
    return false;
  }
}

async function cmdImages(filter: string | undefined, force: boolean) {
  let minis = loadAllSyncMinis();
  minis = filterSyncMinis(minis, filter);

  if (minis.length === 0) {
    console.error(
      filter ? `No mini found: ${filter}` : "No minis with FREE VTT downloads"
    );
    process.exit(1);
  }

  console.log(`Generating resized images for ${minis.length} minis...`);
  let created = 0;
  let skipped = 0;
  let failed = 0;

  const results = await processInBatches(minis, async (mini) => {
    const folder = folderForId(mini.miniId);
    const outputDir = path.join(OUTPUT_DIR, folder);

    if (fs.existsSync(path.join(outputDir, "400.png")) && !force) {
      return "skipped" as const;
    }

    const zipPath = path.join(PAPERFORGE_DIR, mini.zipFilename);
    if (!fs.existsSync(zipPath)) {
      console.error(
        `  Missing zip: ${mini.zipFilename} (#${mini.miniId} ${mini.name})`
      );
      return "failed" as const;
    }

    const ok = await extractPortraitImage(
      zipPath,
      outputDir,
      mini.portraitPath
    );
    if (ok) {
      console.log(`  ✓ #${mini.miniId} ${mini.name}`);
      return "created" as const;
    }
    console.error(`  ✗ #${mini.miniId} ${mini.name}`);
    return "failed" as const;
  });

  for (const r of results) {
    if (r === "created") created++;
    else if (r === "skipped") skipped++;
    else failed++;
  }

  console.log(`\nCreated: ${created}, skipped: ${skipped}, failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

// --- Index: generate lib/paperforge-catalog.ts ---

function sortMiniId(a: string, b: string): number {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

function cmdIndex() {
  const allMinis = loadAllSyncMinis();
  const allWithPortraits = allMinis.filter((m) => {
    const folder = folderForId(m.miniId);
    return fs.existsSync(path.join(OUTPUT_DIR, folder, "400.png"));
  });

  allWithPortraits.sort((a, b) => sortMiniId(a.miniId, b.miniId));

  const entriesString = allWithPortraits
    .map((m) => {
      const folder = folderForId(m.miniId);
      const parts = [
        `    id: ${JSON.stringify(m.miniId)},`,
        `    name: ${JSON.stringify(m.name)},`,
      ];
      if (m.url) {
        parts.push(`    postUrl: ${JSON.stringify(m.url)},`);
      }
      parts.push(`    folder: ${JSON.stringify(folder)},`);
      return `  {\n${parts.join("\n")}\n  }`;
    })
    .join(",\n");

  const content = `// Auto-generated by tools/paperforge
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
    (e) => e.name.toLowerCase() === identifier.toLowerCase(),
  );
  if (byName) return byName;

  return null;
}
`;

  fs.writeFileSync(INDEX_PATH, content);
  console.log(
    `Generated ${INDEX_PATH} with ${allWithPortraits.length} entries`
  );
}

// --- Upload: push resized images to Tigris ---

const s3 = new S3Client({});

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
      // doesn't exist, upload
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

async function cmdUpload(filter: string | undefined, force: boolean) {
  let minis = loadAllSyncMinis();
  minis = filterSyncMinis(minis, filter);

  const entries = minis
    .filter((m) => {
      const folder = folderForId(m.miniId);
      return fs.existsSync(path.join(OUTPUT_DIR, folder, "400.png"));
    })
    .map((m) => ({
      mini: m,
      folder: folderForId(m.miniId),
      outputDir: path.join(OUTPUT_DIR, folderForId(m.miniId)),
    }));

  if (entries.length === 0) {
    console.error("No local images to upload");
    process.exit(1);
  }

  console.log(`Uploading ${entries.length} entries to Tigris...`);
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  const results = await processInBatches(
    entries,
    async ({ folder, outputDir }) => {
      try {
        const sizeResults = await Promise.all(
          IMAGE_SIZES.map((size) =>
            uploadSingleSize(outputDir, folder, size, force)
          )
        );
        const uploaded = sizeResults.filter((r) => r === "uploaded").length;
        const skipped = sizeResults.filter((r) => r === "exists").length;
        return { uploaded, skipped, failed: false };
      } catch (e) {
        console.error(
          `  Error uploading ${folder}:`,
          e instanceof Error ? e.message : String(e)
        );
        return { uploaded: 0, skipped: 0, failed: true };
      }
    }
  );

  for (const { uploaded, skipped, failed } of results) {
    totalUploaded += uploaded;
    totalSkipped += skipped;
    if (failed) totalFailed++;
  }

  console.log(
    `Uploaded: ${totalUploaded}, skipped: ${totalSkipped}, failed: ${totalFailed}`
  );
  if (totalFailed > 0) process.exit(1);
}

// --- Verify: compare local vs remote ---

interface IndexEntry {
  id: string;
  name: string;
  folder: string;
}

function parseIndex(): IndexEntry[] {
  const content = fs.readFileSync(INDEX_PATH, "utf-8");
  const entries: IndexEntry[] = [];
  const regex =
    /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[^}]*folder:\s*"([^"]+)"/g;
  for (const match of content.matchAll(regex)) {
    entries.push({ id: match[1], name: match[2], folder: match[3] });
  }
  return entries;
}

async function cmdVerify() {
  const entries = parseIndex();
  console.log(`Verifying ${entries.length} catalog entries against Tigris...`);

  const results = await processInBatches(entries, async (entry) => {
    const sizes = await Promise.all(
      IMAGE_SIZES.map(async (size) => {
        const key = `paperforge/${entry.folder}/${size}.png`;
        const localPath = path.join(OUTPUT_DIR, entry.folder, `${size}.png`);

        if (!fs.existsSync(localPath)) {
          return { size, result: "missing-local" as const };
        }

        const localBuffer = fs.readFileSync(localPath);
        const localMd5 = createHash("md5").update(localBuffer).digest("hex");

        try {
          const head = await s3.send(
            new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key })
          );
          const remoteEtag = head.ETag?.replace(/"/g, "");
          return {
            size,
            result: (localMd5 === remoteEtag ? "match" : "mismatch") as
              | "match"
              | "mismatch",
          };
        } catch {
          return { size, result: "missing-remote" as const };
        }
      })
    );

    const mismatches = sizes
      .filter((s) => s.result === "mismatch")
      .map((s) => s.size);
    const missingRemote = sizes
      .filter((s) => s.result === "missing-remote")
      .map((s) => s.size);
    const missingLocal = sizes
      .filter((s) => s.result === "missing-local")
      .map((s) => s.size);

    return { entry, mismatches, missingRemote, missingLocal };
  });

  const failures = results.filter(
    (r) =>
      r.mismatches.length > 0 ||
      r.missingRemote.length > 0 ||
      r.missingLocal.length > 0
  );

  if (failures.length === 0) {
    console.log(`All ${entries.length} entries verified.`);
    return;
  }

  console.log(`\n=== Verification Failures ===`);
  for (const { entry, mismatches, missingRemote, missingLocal } of failures) {
    const issues: string[] = [];
    if (mismatches.length > 0)
      issues.push(`mismatch: ${mismatches.join(", ")}`);
    if (missingRemote.length > 0)
      issues.push(`missing remote: ${missingRemote.join(", ")}`);
    if (missingLocal.length > 0)
      issues.push(`missing local: ${missingLocal.join(", ")}`);
    console.log(`  #${entry.id} ${entry.name}: ${issues.join("; ")}`);
  }
  console.log(`\n${failures.length} entries with issues.`);
  process.exit(1);
}

// --- Verify-remote: check remote existence only ---

async function cmdVerifyRemote() {
  const entries = parseIndex();
  console.log(`Endpoint: ${process.env.AWS_ENDPOINT_URL_S3 ?? "(not set)"}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Verifying ${entries.length} catalog entries exist in Tigris...`);

  let firstErrorLogged = false;
  const results = await processInBatches(entries, async (entry) => {
    const sizes = await Promise.all(
      IMAGE_SIZES.map(async (size) => {
        const key = `paperforge/${entry.folder}/${size}.png`;
        try {
          await s3.send(
            new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key })
          );
          return { size, exists: true };
        } catch (e) {
          if (!firstErrorLogged) {
            firstErrorLogged = true;
            console.log(`First check failed: ${BUCKET_NAME}/${key}`);
            console.log(`Error: ${e instanceof Error ? e.message : String(e)}`);
          }
          return { size, exists: false };
        }
      })
    );
    return {
      entry,
      missing: sizes.filter((s) => !s.exists).map((s) => s.size),
    };
  });

  const failures = results.filter((r) => r.missing.length > 0);

  if (failures.length === 0) {
    console.log(`All ${entries.length} entries verified.`);
    return;
  }

  console.log(`\n=== Missing Images ===`);
  for (const { entry, missing } of failures) {
    console.log(
      `  #${entry.id} ${entry.name}: missing sizes ${missing.join(", ")}`
    );
  }
  console.log(`\n${failures.length} entries with missing images.`);
  process.exit(1);
}

// --- All: full pipeline for local dev ---

async function cmdAll(filter: string | undefined, force: boolean) {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.log("=== Scraping catalog ===\n");
    await cmdScrape();
    console.log();
  } else {
    console.log(`Catalog exists: ${CATALOG_PATH}\n`);
  }

  console.log("=== Downloading zips ===\n");
  await cmdDownloadSafe(filter, force);
  console.log();

  console.log("=== Generating images ===\n");
  await cmdImagesSafe(filter, force);
  console.log();

  console.log("=== Generating index ===\n");
  cmdIndex();
}

async function cmdDownloadSafe(filter: string | undefined, force: boolean) {
  let minis = loadAllSyncMinis();
  minis = filterSyncMinis(minis, filter);
  if (minis.length === 0) return;

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const mini of minis) {
    const zipPath = path.join(PAPERFORGE_DIR, mini.zipFilename);
    if (fs.existsSync(zipPath) && !force) {
      skipped++;
      continue;
    }

    const ok = downloadFile(mini.downloadUrl, zipPath);
    if (ok) {
      console.log(`  ↓ #${mini.miniId} ${mini.name}`);
      downloaded++;
    } else {
      console.error(`  ✗ #${mini.miniId} ${mini.name}`);
      failed++;
    }
  }

  console.log(
    `Downloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed}`
  );
}

async function cmdImagesSafe(filter: string | undefined, force: boolean) {
  let minis = loadAllSyncMinis();
  minis = filterSyncMinis(minis, filter);
  if (minis.length === 0) return;

  let created = 0;
  let skipped = 0;
  let failed = 0;

  const results = await processInBatches(minis, async (mini) => {
    const folder = folderForId(mini.miniId);
    const outputDir = path.join(OUTPUT_DIR, folder);

    if (fs.existsSync(path.join(outputDir, "400.png")) && !force) {
      return "skipped" as const;
    }

    const zipPath = path.join(PAPERFORGE_DIR, mini.zipFilename);
    if (!fs.existsSync(zipPath)) {
      return "skipped" as const;
    }

    const ok = await extractPortraitImage(
      zipPath,
      outputDir,
      mini.portraitPath
    );
    if (ok) {
      console.log(`  ✓ #${mini.miniId} ${mini.name}`);
      return "created" as const;
    }
    console.error(`  ✗ #${mini.miniId} ${mini.name}`);
    return "failed" as const;
  });

  for (const r of results) {
    if (r === "created") created++;
    else if (r === "skipped") skipped++;
    else failed++;
  }

  console.log(`Created: ${created}, skipped: ${skipped}, failed: ${failed}`);
}

// --- CLI ---

const USAGE = `Usage: tools/paperforge <command> [options]

Commands:
  scrape              Fetch minis from paperforgeminis.com → ${CATALOG_PATH}
  download [ID]       Download FREE VTT zip files → ${PAPERFORGE_DIR}/
  images [ID]         Extract portraits and resize → ${OUTPUT_DIR}/
  index               Generate TypeScript catalog → ${INDEX_PATH}
  upload [ID]         Upload resized images to Tigris
  verify              Compare local images vs Tigris (checksum)
  verify-remote       Check Tigris for missing images
  all [ID]            Run: scrape (if needed) → download → images → index

Options:
  --force             Re-download/re-process even if output exists

ID can be a mini number (e.g. 96) or UUID.`;

async function main() {
  const args = process.argv.slice(2);
  const command = args.find((a) => !a.startsWith("--"));
  const force = args.includes("--force");
  const positional = args.filter((a) => !a.startsWith("--"));
  const filter = positional[1];

  if (!command) {
    console.log(USAGE);
    process.exit(1);
  }

  switch (command) {
    case "scrape":
      await cmdScrape();
      break;
    case "download":
      await cmdDownload(filter, force);
      break;
    case "images":
      await cmdImages(filter, force);
      break;
    case "index":
      cmdIndex();
      break;
    case "upload":
      await cmdUpload(filter, force);
      break;
    case "verify":
      await cmdVerify();
      break;
    case "verify-remote":
      await cmdVerifyRemote();
      break;
    case "all":
      await cmdAll(filter, force);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exit(1);
  }
}

main();
