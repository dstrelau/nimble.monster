import { readFileSync } from "node:fs";
import { join } from "node:path";

interface TermData {
  term: string;
  aliases?: string[];
  href: string;
  preview: string;
}

function parseTermsYaml(raw: string): TermData[] {
  const entries: TermData[] = [];

  // Split into blocks starting with "- term:"
  const blocks = raw.split(/\n- term:/).slice(1);
  for (const block of blocks) {
    const full = `- term:${block}`;

    const termMatch = full.match(/term:\s*"([^"]+)"/);
    if (!termMatch) continue;

    const hrefMatch = full.match(/href:\s*"([^"]+)"/);
    if (!hrefMatch) continue;

    const previewMatch = full.match(/preview:\s*"((?:[^"\\]|\\.)*)"/);
    if (!previewMatch) continue;

    const aliasesMatch = full.match(/aliases:\s*\[([^\]]*)\]/);
    let aliases: string[] | undefined;
    if (aliasesMatch) {
      aliases = aliasesMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^"(.*)"$/, "$1"))
        .filter(Boolean);
    }

    entries.push({
      term: termMatch[1],
      aliases,
      href: hrefMatch[1],
      preview: previewMatch[1],
    });
  }

  return entries;
}

function loadTerms(): TermData[] {
  const filePath = join(process.cwd(), "data/reference/terms.yaml");
  const raw = readFileSync(filePath, "utf-8");
  return parseTermsYaml(raw);
}

const terms = loadTerms();

export const termIndex: Map<string, { href: string; preview: string }> =
  new Map();

export const previewMap: Record<string, string> = {};

for (const entry of terms) {
  const value = { href: entry.href, preview: entry.preview };

  const mainKey = entry.term.toLowerCase();
  termIndex.set(mainKey, value);
  previewMap[mainKey] = entry.preview;

  if (entry.aliases) {
    for (const alias of entry.aliases) {
      const aliasKey = alias.toLowerCase();
      termIndex.set(aliasKey, value);
      previewMap[aliasKey] = entry.preview;
    }
  }
}
