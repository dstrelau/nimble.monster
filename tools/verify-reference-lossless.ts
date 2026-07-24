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
// `<slug>.mdx`; otherwise reads it from git. The monolithic files were removed
// from the working tree AND committed as deletions, so `HEAD:` no longer holds
// them — we resolve the last commit that touched the path and read from its
// parent (the commit where the file still existed with its final content).
function originalBody(slug: string): string | null {
  const path = `data/reference/${slug}.mdx`;
  const onDisk = join(REFERENCE_DIR, `${slug}.mdx`);
  if (existsSync(onDisk)) return stripFrontmatter(readFileSync(onDisk, "utf-8"));

  const head = gitShow(`HEAD:${path}`);
  if (head !== null) return stripFrontmatter(head);

  try {
    const delCommit = execFileSync(
      "git",
      ["rev-list", "-1", "HEAD", "--", path],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (!delCommit) return null;
    const parentBody = gitShow(`${delCommit}^:${path}`);
    return parentBody === null ? null : stripFrontmatter(parentBody);
  } catch {
    return null;
  }
}

function gitShow(ref: string): string | null {
  try {
    return execFileSync("git", ["show", ref], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : raw;
}

const HEADING_RE = /^#{1,6}\s+(.+?)\s*$/;
const LIST_MARKER_RE = /^(?:[*+-]\s+|\d+\.\s+)/;
// A leading inline bold label: `**Blinded.**` or `**Wounds**`, optionally
// preceded by a list marker. Only labels at the START of a (marker-stripped)
// line count — mid-line bold like `**Full Cover**` stays prose.
const LEADING_LABEL_RE = /^\*\*(.+?)\*\*\.?\s*/;

// Canonical form shared by heading text AND bold-label text. This is what makes
// a promoted `### Dying` heading equivalent to the original `**{{term:Dying}}.**`
// list label: unwrap term markers, drop bold markers, lowercase, drop a trailing
// period, and collapse whitespace.
function normLabel(text: string): string {
  return text
    .replace(/\{\{term:([^}]+)\}\}/g, "$1")
    .replace(/\*\*/g, "")
    .toLowerCase()
    .replace(/\.\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Non-heading PROSE lines with list markers and any leading bold label stripped,
// whitespace-normalized, as a count-sensitive multiset. The label is removed so
// that promoting a `**Blinded.**` label into a `### Blinded` heading leaves the
// remaining prose identical on both sides; a genuinely dropped item still loses
// its prose remainder and is caught here.
function proseMultiset(body: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const rawLine of body.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed || HEADING_RE.test(trimmed)) continue;
    const withoutMarker = trimmed.replace(LIST_MARKER_RE, "");
    const withoutLabel = withoutMarker.replace(LEADING_LABEL_RE, "");
    const line = withoutLabel.replace(/\s+/g, " ").trim();
    if (!line) continue;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return counts;
}

// LABEL tokens from BOTH headings and leading bold labels, normalized to the
// same canonical form. A bold-label→heading promotion relocates a token from
// the inline set to the heading set but keeps it present; a dropped label
// disappears from both. Composed must be a superset (new boundary headings are
// allowed, none of the originals may be lost).
function labelMultiset(body: string): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (t: string) => {
    const n = normLabel(t);
    if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
  };
  for (const rawLine of body.split("\n")) {
    const trimmed = rawLine.trim();
    const hm = trimmed.match(HEADING_RE);
    if (hm) {
      add(hm[1]);
      continue;
    }
    const lm = trimmed.replace(LIST_MARKER_RE, "").match(/^\*\*(.+?)\*\*/);
    if (lm) add(lm[1]);
  }
  return counts;
}

function diffProse(
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

function diffLabels(
  original: Map<string, number>,
  composed: Map<string, number>
): string[] {
  const problems: string[] = [];
  for (const [label, n] of original) {
    const m = composed.get(label) ?? 0;
    if (m < n) problems.push(`  lost label/heading (${n - m}x): ${label}`);
  }
  return problems;
}

function main(): void {
  const pages = getAllReferenceFrontmatter();
  let failures = 0;

  for (const page of pages) {
    const original = originalBody(page.slug);
    if (original === null) {
      console.error(`✗ ${page.slug}: no original body found (disk or git)`);
      failures++;
      continue;
    }
    const composed = getReferenceFileBySlug(page.slug);
    if (!composed) {
      console.error(`✗ ${page.slug}: could not compose page`);
      failures++;
      continue;
    }

    const problems = [
      ...diffProse(proseMultiset(original), proseMultiset(composed.content)),
      ...diffLabels(labelMultiset(original), labelMultiset(composed.content)),
    ];

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
