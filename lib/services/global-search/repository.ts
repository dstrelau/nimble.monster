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
  return fields.find(({ value }) => hasAllPrefixMatches([value], queryWords))
    ?.field;
}

function fieldWeight(field: GlobalSearchResult["matchedField"]): number {
  switch (field) {
    case "name":
      return 10_000;
    case "keywords":
      return 1_000;
    case "summary":
      return 100;
    case "body":
      return 10;
    default:
      return 0;
  }
}

function rankingScore(
  name: string,
  query: string,
  field: GlobalSearchResult["matchedField"],
  bm25Rank = 0
): number {
  const normalizedName = normalizedPhrase(name);
  const normalizedQuery = normalizedPhrase(query);
  const exactBoost = normalizedName === normalizedQuery ? 1_000_000 : 0;
  const prefixBoost = normalizedName.startsWith(normalizedQuery) ? 100_000 : 0;
  return exactBoost + prefixBoost + fieldWeight(field) - bm25Rank;
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
      name,
      query,
      field,
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
        score: rankingScore(rule.title, query, field),
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
      score: rankingScore(faq.question, query, field),
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
  const where = ["catalog.visibility = ?", "global_search_fts MATCH ?"];
  const args: (string | number)[] = ["public", matchQuery];

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
        monsters.paperforge_id,
        items.image_icon
      FROM global_search_fts
      INNER JOIN global_search_catalog AS catalog
        ON catalog.id = global_search_fts.rowid
      LEFT JOIN users ON users.id = catalog.creator_id
      LEFT JOIN monsters
        ON catalog.entity_type = 'monster' AND monsters.id = catalog.entity_id
      LEFT JOIN items
        ON catalog.entity_type = 'item' AND items.id = catalog.entity_id
      WHERE ${where.join(" AND ")}
      ORDER BY rank ASC, catalog.name COLLATE NOCASE ASC, catalog.entity_id ASC
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
