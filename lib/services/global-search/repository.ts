import type { Row } from "@libsql/client";
import { getClient } from "@/lib/db/client";
import { getAllRuleFaqs, ruleFaqUrl } from "@/lib/rules/faqs";
import { getAllRules } from "@/lib/rules/filesystem";
import { tokenizeForSearch } from "@/lib/rules/keyword-search";
import {
  getAdventureUrl,
  getAncestryUrl,
  getBackgroundUrl,
  getClassUrl,
  getCollectionUrl,
  getCompanionUrl,
  getCustomRuleUrl,
  getEncounterUrl,
  getFamilyUrl,
  getItemUrl,
  getMonsterUrl,
  getSpellSchoolUrl,
  getSubclassUrl,
} from "@/lib/utils/url";
import {
  GLOBAL_SEARCH_ENTITY_TYPES,
  type GlobalSearchEntityType,
  type GlobalSearchFilters,
  type GlobalSearchResult,
} from "./contract";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type CatalogRow = {
  entity_type: unknown;
  entity_id: unknown;
  creator_id: unknown;
  creator_name: unknown;
  creator_username: unknown;
  name: unknown;
  subtitle: unknown;
  keywords: unknown;
  summary: unknown;
  body: unknown;
  rank: unknown;
  name_priority: unknown;
  paperforge_id: unknown;
  image_icon: unknown;
};

interface RankedResult {
  result: GlobalSearchResult;
  score: number;
}

function isGlobalSearchEntityType(
  value: string
): value is GlobalSearchEntityType {
  return GLOBAL_SEARCH_ENTITY_TYPES.some((type) => type === value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function normalizedPhrase(value: string): string {
  return tokenizeForSearch(value).join(" ");
}

function hasAllPrefixMatches(fields: string[], queryWords: string[]): boolean {
  const words = fields.flatMap(tokenizeForSearch);
  return queryWords.every((queryWord) =>
    words.some((word) => word.startsWith(queryWord))
  );
}

function matchedField(
  fields: { field: GlobalSearchResult["matchedField"]; value: string }[],
  queryWords: string[]
): GlobalSearchResult["matchedField"] {
  if (queryWords.length === 0) return undefined;
  return fields.find(({ value }) => hasAllPrefixMatches([value], queryWords))
    ?.field;
}

function namePriority(name: string, query: string): number {
  const normalizedName = normalizedPhrase(name);
  const normalizedQuery = normalizedPhrase(query);
  if (normalizedName === normalizedQuery) return 2;
  return normalizedName.startsWith(normalizedQuery) ? 1 : 0;
}

function rankingScore(priority: number, bm25Rank = 0): number {
  return priority * 1_000_000 - bm25Rank;
}

function resultHref(
  type: GlobalSearchEntityType,
  entity: { id: string; name: string; subtitle: string }
): string {
  switch (type) {
    case "monster":
    case "hazard":
      return getMonsterUrl({
        id: entity.id,
        name: entity.name,
        hazard: type === "hazard",
      });
    case "item":
      return getItemUrl(entity);
    case "companion":
      return getCompanionUrl(entity);
    case "ancestry":
      return getAncestryUrl(entity);
    case "background":
      return getBackgroundUrl(entity);
    case "class":
      return getClassUrl(entity);
    case "subclass":
      return getSubclassUrl({
        id: entity.id,
        name: entity.name,
        namePreface: entity.subtitle || undefined,
      });
    case "spellSchool":
      return getSpellSchoolUrl(entity);
    case "collection":
      return getCollectionUrl(entity);
    case "encounter":
      return getEncounterUrl(entity);
    case "adventure":
      return getAdventureUrl(entity);
    case "family":
      return getFamilyUrl(entity);
    case "rule":
      return getCustomRuleUrl(entity);
  }
}

function toCatalogResult(row: CatalogRow, query: string): RankedResult | null {
  const typeValue = stringValue(row.entity_type);
  if (!isGlobalSearchEntityType(typeValue)) return null;

  const id = stringValue(row.entity_id);
  const name = stringValue(row.name);
  const subtitle = stringValue(row.subtitle);
  const keywords = stringValue(row.keywords);
  const summary = stringValue(row.summary);
  const body = stringValue(row.body);
  const queryWords = tokenizeForSearch(query);
  const field = matchedField(
    [
      { field: "name", value: name },
      { field: "keywords", value: keywords },
      { field: "summary", value: summary },
      { field: "body", value: body },
    ],
    queryWords
  );
  const creatorId = row.creator_id == null ? "" : stringValue(row.creator_id);
  const creatorName = stringValue(row.creator_name);
  const creatorUsername = stringValue(row.creator_username);
  const paperforgeId = stringValue(row.paperforge_id);
  const imageIcon = stringValue(row.image_icon);

  return {
    result: {
      type: typeValue,
      id,
      name,
      ...(subtitle ? { subtitle } : {}),
      href: resultHref(typeValue, { id, name, subtitle }),
      ...(creatorId
        ? {
            creator: {
              id: creatorId,
              name: creatorName,
              ...(creatorUsername ? { username: creatorUsername } : {}),
            },
          }
        : {}),
      ...(field ? { matchedField: field } : {}),
      ...(paperforgeId ? { paperforgeId } : {}),
      ...(imageIcon ? { imageIcon } : {}),
    },
    score: rankingScore(
      Number.isFinite(Number(row.name_priority))
        ? Number(row.name_priority)
        : namePriority(name, query),
      Number.isFinite(Number(row.rank)) ? Number(row.rank) : 0
    ),
  };
}

function toCatalogRow(row: Row): CatalogRow {
  return {
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    creator_id: row.creator_id,
    creator_name: row.creator_name,
    creator_username: row.creator_username,
    name: row.name,
    subtitle: row.subtitle,
    keywords: row.keywords,
    summary: row.summary,
    body: row.body,
    rank: row.rank,
    name_priority: row.name_priority,
    paperforge_id: row.paperforge_id,
    image_icon: row.image_icon,
  };
}

function searchOfficialRules(
  query: string,
  filters: GlobalSearchFilters
): RankedResult[] {
  if (filters.creatorId || (filters.types && !filters.types.includes("rule"))) {
    return [];
  }

  const queryWords = tokenizeForSearch(query);
  const ranked: RankedResult[] = getAllRules().flatMap((rule) => {
    const field = matchedField(
      [
        { field: "name", value: rule.title },
        { field: "keywords", value: rule.keywords.join(" ") },
        { field: "body", value: rule.content },
      ],
      queryWords
    );
    if (
      !hasAllPrefixMatches(
        [rule.title, rule.keywords.join(" "), rule.content],
        queryWords
      )
    ) {
      return [];
    }
    return [
      {
        result: {
          type: "rule",
          id: rule.slug,
          name: rule.title,
          subtitle: "Official rule",
          href: rule.variantOf
            ? `/rules/${rule.variantOf}#variant-${rule.slug}`
            : `/rules/${rule.slug}`,
          ...(field ? { matchedField: field } : {}),
        },
        score: rankingScore(namePriority(rule.title, query)),
      },
    ];
  });

  const bySlug = new Map(getAllRules().map((rule) => [rule.slug, rule]));
  for (const faq of getAllRuleFaqs()) {
    const field = matchedField(
      [
        { field: "name", value: faq.question },
        { field: "keywords", value: faq.keywords.join(" ") },
        { field: "body", value: faq.answer },
      ],
      queryWords
    );
    if (
      !hasAllPrefixMatches(
        [faq.question, faq.keywords.join(" "), faq.answer],
        queryWords
      ) ||
      !bySlug.has(faq.targets[0]?.ruleSlug)
    ) {
      continue;
    }
    ranked.push({
      result: {
        type: "rule",
        id: `faq:${faq.slug}`,
        name: faq.question,
        subtitle: "Official rule FAQ",
        href: ruleFaqUrl(faq),
        ...(field ? { matchedField: field } : {}),
      },
      score: rankingScore(namePriority(faq.question, query)),
    });
  }
  return ranked;
}

function compareRankedResults(a: RankedResult, b: RankedResult): number {
  return (
    b.score - a.score ||
    a.result.name.localeCompare(b.result.name) ||
    a.result.type.localeCompare(b.result.type) ||
    a.result.id.localeCompare(b.result.id)
  );
}

function sourceTable(type: GlobalSearchEntityType): string {
  switch (type) {
    case "monster":
    case "hazard":
      return "monsters";
    case "item":
      return "items";
    case "companion":
      return "companions";
    case "ancestry":
      return "ancestries";
    case "background":
      return "backgrounds";
    case "class":
      return "classes";
    case "subclass":
      return "subclasses";
    case "spellSchool":
      return "spell_schools";
    case "collection":
      return "collections";
    case "encounter":
      return "encounters";
    case "adventure":
      return "adventures";
    case "family":
      return "families";
    case "rule":
      return "custom_rules";
  }
}

export async function listRecentGlobal(
  type: GlobalSearchEntityType,
  limit = DEFAULT_LIMIT
): Promise<GlobalSearchResult[]> {
  const boundedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const table = sourceTable(type);
  const dbResults = await getClient().execute({
    sql: `
      SELECT
        catalog.entity_type,
        catalog.entity_id,
        catalog.creator_id,
        COALESCE(NULLIF(users.display_name, ''), NULLIF(users.username, ''), NULLIF(users.name, ''), '') AS creator_name,
        users.username AS creator_username,
        catalog.name,
        catalog.subtitle,
        catalog.keywords,
        catalog.summary,
        catalog.body,
        0 AS rank,
        0 AS name_priority,
        monsters.paperforge_id,
        items.image_icon
      FROM global_search_catalog AS catalog
      INNER JOIN ${table} AS entity ON entity.id = catalog.entity_id
      LEFT JOIN users ON users.id = catalog.creator_id
      LEFT JOIN monsters
        ON catalog.entity_type = 'monster' AND monsters.id = catalog.entity_id
      LEFT JOIN items
        ON catalog.entity_type = 'item' AND items.id = catalog.entity_id
      WHERE catalog.visibility = ? AND catalog.entity_type = ?
      ORDER BY entity.created_at DESC, catalog.id DESC
      LIMIT ?
    `,
    args: ["public", type, boundedLimit],
  });

  const results = dbResults.rows.flatMap((row) => {
    const ranked = toCatalogResult(toCatalogRow(row), "");
    return ranked ? [ranked.result] : [];
  });
  if (type !== "rule" || results.length >= boundedLimit) return results;

  const resultIds = new Set(results.map((result) => result.id));
  const officialRules = searchOfficialRules("", { types: ["rule"] })
    .map(({ result }) => result)
    .filter((result) => !resultIds.has(result.id));
  return [...results, ...officialRules].slice(0, boundedLimit);
}

export async function searchGlobal(
  query: string,
  filters: GlobalSearchFilters = {}
): Promise<GlobalSearchResult[]> {
  const queryWords = tokenizeForSearch(query);
  if (queryWords.length === 0) return [];

  const limit = Math.min(
    Math.max(filters.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const selectedTypes = filters.types?.filter(isGlobalSearchEntityType) ?? [];
  const matchQuery = queryWords.map((word) => `"${word}"*`).join(" AND ");
  const namePrefixQuery = `name:^"${queryWords.join(" ")}"*`;
  const where = ["catalog.visibility = ?", "global_search_fts MATCH ?"];
  const args: (string | number)[] = [
    namePrefixQuery,
    query.trim().toLowerCase(),
    "public",
    matchQuery,
  ];

  if (selectedTypes.length > 0) {
    where.push(
      `catalog.entity_type IN (${selectedTypes.map(() => "?").join(", ")})`
    );
    args.push(...selectedTypes);
  }
  if (filters.creatorId) {
    where.push("catalog.creator_id = ?");
    args.push(filters.creatorId);
  }
  args.push(limit);

  const dbResults = await getClient().execute({
    sql: `
      WITH name_prefix_matches AS (
        SELECT rowid
        FROM global_search_fts
        WHERE global_search_fts MATCH ?
      )
      SELECT
        catalog.entity_type,
        catalog.entity_id,
        catalog.creator_id,
        COALESCE(NULLIF(users.display_name, ''), NULLIF(users.username, ''), NULLIF(users.name, ''), '') AS creator_name,
        users.username AS creator_username,
        catalog.name,
        catalog.subtitle,
        catalog.keywords,
        catalog.summary,
        catalog.body,
        bm25(global_search_fts, 12.0, 5.0, 2.0, 1.0) AS rank,
        CASE
          WHEN lower(trim(catalog.name)) = ? THEN 2
          WHEN name_prefix_matches.rowid IS NOT NULL THEN 1
          ELSE 0
        END AS name_priority,
        monsters.paperforge_id,
        items.image_icon
      FROM global_search_fts
      INNER JOIN global_search_catalog AS catalog
        ON catalog.id = global_search_fts.rowid
      LEFT JOIN name_prefix_matches
        ON name_prefix_matches.rowid = global_search_fts.rowid
      LEFT JOIN users ON users.id = catalog.creator_id
      LEFT JOIN monsters
        ON catalog.entity_type = 'monster' AND monsters.id = catalog.entity_id
      LEFT JOIN items
        ON catalog.entity_type = 'item' AND items.id = catalog.entity_id
      WHERE ${where.join(" AND ")}
      ORDER BY name_priority DESC, rank ASC, catalog.name COLLATE NOCASE ASC, catalog.entity_id ASC
      LIMIT ?
    `,
    args,
  });

  const ranked = dbResults.rows
    .map((row) => toCatalogResult(toCatalogRow(row), query))
    .filter((row): row is RankedResult => row !== null);
  ranked.push(...searchOfficialRules(query, filters));

  return ranked
    .sort(compareRankedResults)
    .slice(0, limit)
    .map(({ result }) => result);
}

export { MAX_LIMIT };
