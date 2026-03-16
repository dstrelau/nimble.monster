import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  deleteAllReferenceEntries,
  rebuildReferenceSearchIndex,
  upsertReferenceEntry,
} from "../lib/db/reference";
import { termIndex } from "../lib/reference/terms";

function parseFrontmatter(
  raw: string
): { meta: Record<string, string | number>; content: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const meta: Record<string, string | number> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();
    const strVal = rawVal.replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"');
    const numVal = Number(strVal);
    meta[key] = Number.isNaN(numVal) ? strVal : numVal;
  }

  return { meta, content: match[2] };
}

function collectMdFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectMdFiles(full));
    } else if (entry.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const referenceDir = join(process.cwd(), "data/reference");

  console.log("Clearing existing entries...");
  await deleteAllReferenceEntries();

  let imported = 0;
  let errors = 0;

  const files = collectMdFiles(referenceDir);

  for (const filePath of files) {
    const relativePath = relative(referenceDir, filePath);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const parsed = parseFrontmatter(raw);
      if (!parsed) {
        console.error(`✗ ${relativePath}: missing or invalid frontmatter`);
        errors++;
        continue;
      }

      const { meta, content } = parsed;
      const slug = String(meta.slug);
      const title = String(meta.title);
      const category = String(meta.category);

      if (!slug || !title || !category) {
        console.error(`✗ ${relativePath}: frontmatter missing required fields (slug, title, category)`);
        errors++;
        continue;
      }

      await upsertReferenceEntry({
        slug,
        title,
        category,
        content,
        sourceFile: relativePath,
        orderIndex: 0,
      });

      // Validate {{term:...}} markers reference valid terms
      const termRe = /\{\{term:([^}]+)\}\}/g;
      for (const tm of content.matchAll(termRe)) {
        if (!termIndex.has(tm[1].toLowerCase())) {
          console.error(`✗ ${relativePath}: invalid term reference "{{term:${tm[1]}}}"`);
          errors++;
        }
      }

      console.log(`✓ [${category}] ${title} (${slug})`);
      imported++;
    } catch (err) {
      console.error(
        `✗ ${relativePath}: ${err instanceof Error ? err.message : err}`
      );
      errors++;
    }
  }

  console.log("\nRebuilding FTS index...");
  await rebuildReferenceSearchIndex();

  console.log(`\nDone: ${imported} imported, ${errors} errors`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
