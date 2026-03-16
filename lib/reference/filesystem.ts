import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ReferenceFrontmatter {
  title: string;
  slug: string;
  category: string;
}

export interface ReferenceFile extends ReferenceFrontmatter {
  content: string;
}

const REFERENCE_DIR = join(process.cwd(), "data/reference");

function parseFrontmatter(raw: string): {
  frontmatter: ReferenceFrontmatter;
  content: string;
} | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (kv) fm[kv[1]] = kv[2];
  }

  if (!fm.title || !fm.slug || !fm.category) return null;

  return {
    frontmatter: {
      title: fm.title,
      slug: fm.slug,
      category: fm.category,
    },
    content: match[2],
  };
}

export function getAllReferenceSlugs(): string[] {
  const files = readdirSync(REFERENCE_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((f) => f.replace(/\.mdx$/, ""));
}

export function getReferenceFileBySlug(slug: string): ReferenceFile | null {
  const filePath = join(REFERENCE_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  return { ...parsed.frontmatter, content: parsed.content };
}

export function getAllReferenceFrontmatter(): ReferenceFrontmatter[] {
  const files = readdirSync(REFERENCE_DIR).filter((f) => f.endsWith(".mdx"));
  const entries: ReferenceFrontmatter[] = [];
  for (const file of files) {
    const raw = readFileSync(join(REFERENCE_DIR, file), "utf-8");
    const parsed = parseFrontmatter(raw);
    if (parsed) entries.push(parsed.frontmatter);
  }
  return entries;
}
