import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface TopicRef {
  entry: string;
  anchor?: string;
}

export interface Topic {
  slug: string;
  label: string;
  category: string;
  refs: TopicRef[];
}

function stripValue(raw: string): string {
  return raw
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");
}

export function parseTopicsYaml(raw: string): Topic[] {
  const topics: Topic[] = [];

  let slug: string | null = null;
  let label: string | null = null;
  let category: string | null = null;
  let refs: TopicRef[] = [];
  let currentRef: TopicRef | null = null;

  function flush(): void {
    if (slug && label && category && refs.length > 0) {
      topics.push({ slug, label, category, refs });
    }
  }

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const slugMatch = line.match(/^\s*-\s+slug:\s*(.+)$/);
    if (slugMatch) {
      flush();
      slug = stripValue(slugMatch[1]);
      label = null;
      category = null;
      refs = [];
      currentRef = null;
      continue;
    }
    if (slug === null) continue;

    const labelMatch = line.match(/^\s*label:\s*(.+)$/);
    if (labelMatch) {
      label = stripValue(labelMatch[1]);
      continue;
    }
    const categoryMatch = line.match(/^\s*category:\s*(.+)$/);
    if (categoryMatch) {
      category = stripValue(categoryMatch[1]);
      continue;
    }
    const entryMatch = line.match(/^\s*-\s+entry:\s*(.+)$/);
    if (entryMatch) {
      currentRef = { entry: stripValue(entryMatch[1]) };
      refs.push(currentRef);
      continue;
    }
    const anchorMatch = line.match(/^\s*anchor:\s*(.+)$/);
    if (anchorMatch && currentRef) {
      currentRef.anchor = stripValue(anchorMatch[1]);
    }
  }
  flush();

  return topics;
}

function loadTopics(): Topic[] {
  const filePath = join(process.cwd(), "data/reference/topics.yaml");
  const raw = readFileSync(filePath, "utf-8");
  return parseTopicsYaml(raw);
}

const topics = loadTopics();

const topicsBySlug = new Map<string, Topic>();
for (const topic of topics) {
  topicsBySlug.set(topic.slug, topic);
}

export function getAllTopics(): Topic[] {
  return topics;
}

export function getTopicBySlug(slug: string): Topic | undefined {
  return topicsBySlug.get(slug);
}

export function getValidTopicSlugs(): Set<string> {
  return new Set(topicsBySlug.keys());
}
