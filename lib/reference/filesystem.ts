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

export interface ReferenceSection {
  /** Globally unique section id (e.g. "combat-structure__surprise"). */
  slug: string;
  title: string;
  /** Owning page slug (one of the 37 entry slugs). */
  pageSlug: string;
  /** 1-based position within its page. */
  order: number;
  content: string;
}

const REFERENCE_DIR = join(process.cwd(), "data/reference");

interface ManifestPage {
  slug: string;
  title: string;
  category: string;
  sectionSlugs: string[];
}

function parseManifest(raw: string): ManifestPage[] {
  const pages: ManifestPage[] = [];
  let current: ManifestPage | null = null;
  let inSections = false;

  const unquote = (v: string): string =>
    v
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const slugMatch = line.match(/^\s{2}-\s+slug:\s*(.+)$/);
    if (slugMatch) {
      if (current) pages.push(current);
      current = {
        slug: unquote(slugMatch[1]),
        title: "",
        category: "",
        sectionSlugs: [],
      };
      inSections = false;
      continue;
    }
    if (!current) continue;

    const titleMatch = line.match(/^\s{4}title:\s*(.+)$/);
    if (titleMatch) {
      current.title = unquote(titleMatch[1]);
      continue;
    }
    const categoryMatch = line.match(/^\s{4}category:\s*(.+)$/);
    if (categoryMatch) {
      current.category = unquote(categoryMatch[1]);
      continue;
    }
    if (/^\s{4}sections:\s*$/.test(line)) {
      inSections = true;
      continue;
    }
    const itemMatch = line.match(/^\s{6}-\s+(.+)$/);
    if (inSections && itemMatch) {
      current.sectionSlugs.push(unquote(itemMatch[1]));
    }
  }
  if (current) pages.push(current);
  return pages;
}

function parseSectionFile(
  raw: string
): { slug: string; title: string; content: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*"?((?:[^"\\]|\\.)*)"?\s*$/);
    if (kv) fm[kv[1]] = kv[2].replace(/\\"/g, '"');
  }
  if (!fm.slug || !fm.title) return null;
  return {
    slug: fm.slug,
    title: fm.title,
    content: match[2].replace(/\n+$/, ""),
  };
}

interface ReferenceData {
  pages: ManifestPage[];
  pageBySlug: Map<string, ManifestPage>;
  sectionBySlug: Map<string, ReferenceSection>;
  sectionsByPage: Map<string, ReferenceSection[]>;
}

function loadReferenceData(): ReferenceData {
  const manifestRaw = readFileSync(
    join(REFERENCE_DIR, "manifest.yaml"),
    "utf-8"
  );
  const pages = parseManifest(manifestRaw);

  const sectionBySlug = new Map<string, ReferenceSection>();
  const sectionsByPage = new Map<string, ReferenceSection[]>();
  const pageBySlug = new Map<string, ManifestPage>();

  for (const page of pages) {
    pageBySlug.set(page.slug, page);

    // Map each section slug to its file contents by reading the page directory.
    const dir = join(REFERENCE_DIR, page.slug);
    const bySlug = new Map<string, { title: string; content: string }>();
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".mdx")) continue;
      const parsed = parseSectionFile(readFileSync(join(dir, file), "utf-8"));
      if (parsed) bySlug.set(parsed.slug, parsed);
    }

    const sections: ReferenceSection[] = [];
    page.sectionSlugs.forEach((sectionSlug, i) => {
      const file = bySlug.get(sectionSlug);
      if (!file) {
        throw new Error(
          `manifest references missing section "${sectionSlug}" in page "${page.slug}"`
        );
      }
      const section: ReferenceSection = {
        slug: sectionSlug,
        title: file.title,
        pageSlug: page.slug,
        order: i + 1,
        content: file.content,
      };
      sections.push(section);
      sectionBySlug.set(sectionSlug, section);
    });
    sectionsByPage.set(page.slug, sections);
  }

  return { pages, pageBySlug, sectionBySlug, sectionsByPage };
}

let cache: ReferenceData | null = null;
function getData(): ReferenceData {
  if (!cache) cache = loadReferenceData();
  return cache;
}

// ── Page-level accessors (unchanged signatures) ────────────────────────────

export function getAllReferenceSlugs(): string[] {
  return getData().pages.map((p) => p.slug);
}

export function getReferenceFileBySlug(slug: string): ReferenceFile | null {
  const { pageBySlug, sectionsByPage } = getData();
  const page = pageBySlug.get(slug);
  if (!page) return null;
  const sections = sectionsByPage.get(slug) ?? [];
  const content = sections.map((s) => s.content).join("\n\n");
  return {
    title: page.title,
    slug: page.slug,
    category: page.category,
    content,
  };
}

export function getAllReferenceFrontmatter(): ReferenceFrontmatter[] {
  return getData().pages.map((p) => ({
    title: p.title,
    slug: p.slug,
    category: p.category,
  }));
}

// ── Section-level accessors (Stage B/C) ────────────────────────────────────

export function getAllSections(): ReferenceSection[] {
  const { pages, sectionsByPage } = getData();
  return pages.flatMap((p) => sectionsByPage.get(p.slug) ?? []);
}

export function getSectionBySlug(sectionSlug: string): ReferenceSection | null {
  return getData().sectionBySlug.get(sectionSlug) ?? null;
}

export function getSectionsForPage(pageSlug: string): ReferenceSection[] {
  return getData().sectionsByPage.get(pageSlug) ?? [];
}

export function getPageForSection(
  sectionSlug: string
): ReferenceFrontmatter | null {
  const { sectionBySlug, pageBySlug } = getData();
  const section = sectionBySlug.get(sectionSlug);
  if (!section) return null;
  const page = pageBySlug.get(section.pageSlug);
  if (!page) return null;
  return { title: page.title, slug: page.slug, category: page.category };
}
