import { config } from "dotenv";
config({ path: ".env.local" });
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAllReferenceFrontmatter,
  getReferenceFileBySlug,
} from "../lib/reference/filesystem";

const REFERENCE_DIR = join(process.cwd(), "data/reference");

// Reads the ORIGINAL monolithic page body. Prefers a still-present on-disk
// `<slug>.mdx`; falls back to the committed version in git HEAD once the old
// files have been deleted. Losslessness is heading-insensitive, so HEAD (which
// may lack a few later-added boundary headings) is an equally valid source.
function originalBody(slug: string): string | null {
  const onDisk = join(REFERENCE_DIR, `${slug}.mdx`);
  if (existsSync(onDisk)) return stripFrontmatter(readFileSync(onDisk, "utf-8"));
  try {
    const raw = execFileSync(
      "git",
      ["show", `HEAD:data/reference/${slug}.mdx`],
      { encoding: "utf-8" }
    );
    return stripFrontmatter(raw);
  } catch {
    return null;
  }
}

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : raw;
}

const HEADING_RE = /^#{1,6}\s+/;

// Non-heading content lines, whitespace-normalized, as a count-sensitive
// multiset (duplicate lines matter — losing one is content loss).
function contentMultiset(body: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line) continue;
    if (HEADING_RE.test(rawLine.trim())) continue;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return counts;
}

function headingSet(body: string): Set<string> {
  const set = new Set<string>();
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (HEADING_RE.test(line)) set.add(line.replace(/\s+/g, " "));
  }
  return set;
}

function diffMultiset(
  original: Map<string, number>,
  composed: Map<string, number>
): string[] {
  const problems: string[] = [];
  for (const [line, n] of original) {
    const m = composed.get(line) ?? 0;
    if (m < n) problems.push(`  missing content (${n - m}x): ${line}`);
  }
  for (const [line, m] of composed) {
    const n = original.get(line) ?? 0;
    if (m > n) problems.push(`  added content (${m - n}x): ${line}`);
  }
  return problems;
}

function main(): void {
  const pages = getAllReferenceFrontmatter();
  let failures = 0;

  for (const page of pages) {
    const original = originalBody(page.slug);
    if (original === null) {
      console.error(`✗ ${page.slug}: no original body found (disk or HEAD)`);
      failures++;
      continue;
    }
    const composed = getReferenceFileBySlug(page.slug);
    if (!composed) {
      console.error(`✗ ${page.slug}: could not compose page`);
      failures++;
      continue;
    }

    const problems = diffMultiset(
      contentMultiset(original),
      contentMultiset(composed.content)
    );

    // Headings must be a superset (added boundary headings allowed; none lost).
    const origHeadings = headingSet(original);
    const composedHeadings = headingSet(composed.content);
    for (const h of origHeadings) {
      if (!composedHeadings.has(h)) problems.push(`  lost heading: ${h}`);
    }

    if (problems.length > 0) {
      console.error(`✗ ${page.slug}:`);
      for (const p of problems) console.error(p);
      failures++;
    } else {
      console.log(`✓ ${page.slug}`);
    }
  }

  if (failures > 0) {
    console.error(`\nFAIL — ${failures} page(s) with content differences.`);
    process.exit(1);
  }
  console.log(`\nPASS — all ${pages.length} pages lossless.`);
}

main();
