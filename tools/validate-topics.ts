import { config } from "dotenv";
config({ path: ".env.local" });

import { CATEGORIES } from "../lib/reference/categories";
import { getAllReferenceSlugs, getReferenceFileBySlug } from "../lib/reference/filesystem";
import { getAllTopics } from "../lib/reference/topics";

// Copied verbatim from components/reference/ReferenceMarkdown.tsx — this is the
// exact function that turns heading text into an anchor id at render time.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function headingAnchors(content: string): Set<string> {
  const anchors = new Set<string>();
  for (const line of content.split("\n")) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (match) anchors.add(slugify(match[1]));
  }
  return anchors;
}

function main(): void {
  const topics = getAllTopics();
  const validCategories = new Set(CATEGORIES.map((c) => c.slug));
  const validEntrySlugs = new Set(getAllReferenceSlugs());
  const anchorCache = new Map<string, Set<string>>();

  const errors: string[] = [];

  // 1. Unique topic slugs.
  const seen = new Set<string>();
  for (const topic of topics) {
    if (seen.has(topic.slug)) {
      errors.push(`duplicate topic slug: "${topic.slug}"`);
    }
    seen.add(topic.slug);
  }

  for (const topic of topics) {
    // 2. Category must be a real CATEGORIES slug.
    if (!validCategories.has(topic.category)) {
      errors.push(`topic "${topic.slug}": unknown category "${topic.category}"`);
    }

    // 3. Must have at least one ref.
    if (topic.refs.length === 0) {
      errors.push(`topic "${topic.slug}": has no refs`);
    }

    for (const ref of topic.refs) {
      // 4. Entry must be a real reference slug.
      if (!validEntrySlugs.has(ref.entry)) {
        errors.push(`topic "${topic.slug}": ref entry "${ref.entry}" is not a reference slug`);
        continue;
      }

      // 5. Anchor (if present) must match a real heading in that entry.
      if (ref.anchor === undefined) continue;

      let anchors = anchorCache.get(ref.entry);
      if (!anchors) {
        const file = getReferenceFileBySlug(ref.entry);
        anchors = file ? headingAnchors(file.content) : new Set<string>();
        anchorCache.set(ref.entry, anchors);
      }
      if (!anchors.has(ref.anchor)) {
        errors.push(
          `topic "${topic.slug}": anchor "#${ref.anchor}" not found in "${ref.entry}.mdx"`
        );
      }
    }
  }

  const anchored = topics
    .flatMap((t) => t.refs)
    .filter((r) => r.anchor !== undefined).length;
  const refCount = topics.reduce((n, t) => n + t.refs.length, 0);

  console.log(`Validating ${topics.length} topics (${refCount} refs, ${anchored} anchored)...`);

  if (errors.length > 0) {
    console.error(`\nFAIL — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("PASS — all topic slugs unique; every category, entry, and anchor resolves.");
}

main();
