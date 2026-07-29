import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getValidRuleSlugs } from "./filesystem";

// Curated "related rule" edges from data/rules/relations.yaml. Two forms, both
// of which reduce to a group whose members all link to each other:
//
//   groups:              a clique — every member links to every other member
//     - [dying, wounds, wounded]
//   hubs:                a star — every member links to the hub, not to peers
//     conditions: [blinded, charmed, dazed]
//
// Use `hubs` for a large family with an overview rule; a clique of 18 would put
// 17 links under every member.

// Collapse the file into one logical line per entry, dropping comments and
// re-joining flow arrays that wrap across lines.
function logicalLines(raw: string): string[] {
  const lines: string[] = [];
  let buffer = "";
  let depth = 0;
  for (const line of raw.split("\n")) {
    const stripped = line.replace(/#.*$/, "");
    const text = stripped.trim();
    if (!text && depth === 0) continue;
    const indented = /^\s/.test(stripped);
    buffer = buffer ? `${buffer} ${text}` : text;
    depth +=
      (text.match(/\[/g)?.length ?? 0) - (text.match(/\]/g)?.length ?? 0);
    // An indented key with no value yet (`conditions:`) is still waiting for
    // the array below it; a top-level `groups:` / `hubs:` header is complete.
    if (depth <= 0 && !(indented && text.endsWith(":"))) {
      if (buffer) lines.push(buffer);
      buffer = "";
      depth = 0;
    }
  }
  if (buffer) lines.push(buffer);
  return lines;
}

const slugList = (inner: string): string[] =>
  inner
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Parse both forms into groups; a hub becomes one 2-member group per rule. */
export function parseRelationGroups(raw: string): string[][] {
  const groups: string[][] = [];
  let section: "groups" | "hubs" | null = null;

  for (const line of logicalLines(raw)) {
    if (line === "groups:") {
      section = "groups";
      continue;
    }
    if (line === "hubs:") {
      section = "hubs";
      continue;
    }
    const group = line.match(/^-\s*\[(.*)\]$/);
    if (section === "groups" && group) {
      groups.push(slugList(group[1]));
      continue;
    }
    const hub = line.match(/^([\w-]+):\s*\[(.*)\]$/);
    if (section === "hubs" && hub) {
      for (const slug of slugList(hub[2])) groups.push([hub[1], slug]);
    }
  }
  return groups;
}

export function buildRelatedIndex(
  groups: string[][],
  validSlugs: Set<string>
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const group of groups) {
    for (const slug of group) {
      if (!validSlugs.has(slug)) {
        throw new Error(`relations.yaml: unknown rule "${slug}"`);
      }
    }
    for (const from of group) {
      const list = index.get(from) ?? [];
      for (const to of group) {
        if (to !== from && !list.includes(to)) list.push(to);
      }
      index.set(from, list);
    }
  }
  for (const list of index.values()) list.sort();
  return index;
}

let cache: Map<string, string[]> | null = null;

function index(): Map<string, string[]> {
  cache ??= buildRelatedIndex(
    parseRelationGroups(
      readFileSync(join(process.cwd(), "data/rules/relations.yaml"), "utf-8")
    ),
    getValidRuleSlugs()
  );
  return cache;
}

export function getRelatedSlugs(slug: string): string[] {
  return index().get(slug) ?? [];
}
