import { config } from "dotenv";
config({ path: ".env.local" });
import {
  deleteAllReferenceEntries,
  rebuildReferenceSearchIndex,
  upsertReferenceEntry,
} from "../lib/db/reference";
import { seedSectionRelations } from "../lib/db/section-relations";
import {
  getAllReferenceFrontmatter,
  getReferenceFileBySlug,
  getValidSectionSlugs,
} from "../lib/reference/filesystem";
import {
  buildRelatedPairs,
  loadRelatedPairs,
} from "../lib/reference/relations";
import { termIndex } from "../lib/reference/terms";

async function main() {
  console.log("Clearing existing entries...");
  await deleteAllReferenceEntries();

  let imported = 0;
  let errors = 0;

  // Index one row per PAGE (the composed body from its ordered sections) so
  // searchReference keeps returning page slugs addressable at /reference/<slug>.
  const pages = getAllReferenceFrontmatter();

  let index = 0;
  for (const page of pages) {
    const entry = getReferenceFileBySlug(page.slug);
    if (!entry) {
      console.error(`✗ ${page.slug}: could not compose page body`);
      errors++;
      index++;
      continue;
    }
    const { slug, title, category, content } = entry;

    // Validate {{term:...}} markers reference valid terms
    const termRe = /\{\{term:([^}]+)\}\}/g;
    for (const tm of content.matchAll(termRe)) {
      if (!termIndex.has(tm[1].toLowerCase())) {
        console.error(`✗ ${slug}: invalid term reference "{{term:${tm[1]}}}"`);
        errors++;
      }
    }

    await upsertReferenceEntry({
      slug,
      title,
      category,
      content,
      sourceFile: `${slug}/`,
      orderIndex: index,
    });

    console.log(`✓ [${category}] ${title} (${slug})`);
    imported++;
    index++;
  }

  console.log("\nRebuilding FTS index...");
  await rebuildReferenceSearchIndex();

  console.log("Seeding section relations...");
  const pairs = buildRelatedPairs(loadRelatedPairs(), getValidSectionSlugs());
  await seedSectionRelations(pairs);
  console.log(`  ${pairs.length} related pair(s) seeded`);

  console.log(`\nDone: ${imported} imported, ${errors} errors`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
