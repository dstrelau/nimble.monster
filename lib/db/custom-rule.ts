import { and, asc, eq, inArray } from "drizzle-orm";
import { getValidRuleSlugs } from "@/lib/rules/filesystem";
import { tokenizeForSearch } from "@/lib/rules/keyword-search";
import type { User } from "@/lib/types";
import { getCustomRuleUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import { getClient } from "./client";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type CustomRuleRelationType,
  type CustomRuleVisibility,
  customRuleLinks,
  customRules,
  users,
} from "./schema";

// The relation kinds a custom rule may declare against an official rule.
export type CustomRuleRelation = CustomRuleRelationType;

export const DEFAULT_RELATION: CustomRuleRelation = "augments";

export interface CustomRuleLink {
  ruleSlug: string;
  relation: CustomRuleRelation;
}

export interface CustomRule {
  id: string;
  name: string;
  content: string;
  keywords: string;
  visibility: CustomRuleVisibility;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  links: CustomRuleLink[];
  creator: User;
}

// --- Pure helpers (no DB / no filesystem access; unit-tested directly) ---

// Normalize and validate links against the set of valid rule slugs. Trims
// slugs, drops empties, defaults a missing relation to `augments`, dedupes by
// slug (order-preserving; first occurrence wins, which enforces that a rule
// appears under a single relation), and throws on an unknown slug.
export function validateRuleLinks(
  links: { ruleSlug: string; relation?: CustomRuleRelation }[],
  validSlugs: Iterable<string>
): CustomRuleLink[] {
  const valid = new Set(validSlugs);
  const seen = new Set<string>();
  const result: CustomRuleLink[] = [];
  const invalid: string[] = [];

  for (const raw of links) {
    const ruleSlug = raw.ruleSlug.trim();
    if (!ruleSlug || seen.has(ruleSlug)) continue;
    seen.add(ruleSlug);
    if (valid.has(ruleSlug)) {
      result.push({
        ruleSlug,
        relation: raw.relation ?? DEFAULT_RELATION,
      });
    } else {
      invalid.push(ruleSlug);
    }
  }

  if (invalid.length > 0) {
    throw new Error(`Unknown rule(s): ${invalid.join(", ")}`);
  }
  return result;
}

// --- Reverse view: custom rules that link to an official rule ---

export interface CustomRuleReverseRef {
  id: string;
  name: string;
  url: string;
  creator: User;
}

export interface CustomRuleReverseGroups {
  replaces: CustomRuleReverseRef[];
  augments: CustomRuleReverseRef[];
}

// Group reverse-link rows by relation, deduping by rule id within each relation
// (a custom rule may link several official rules under the same relation).
export function groupCustomRuleReverseLinks(
  rows: {
    id: string;
    name: string;
    relation: CustomRuleRelation;
    creator: User;
  }[]
): CustomRuleReverseGroups {
  const seen: Record<CustomRuleRelation, Set<string>> = {
    replaces: new Set(),
    augments: new Set(),
  };
  const groups: CustomRuleReverseGroups = { replaces: [], augments: [] };
  for (const row of rows) {
    if (seen[row.relation].has(row.id)) continue;
    seen[row.relation].add(row.id);
    const result: CustomRuleReverseRef = {
      id: row.id,
      name: row.name,
      url: getCustomRuleUrl(row),
      creator: row.creator,
    };
    groups[row.relation].push(result);
  }
  return groups;
}

// Compute the minimal set of link inserts/deletes to move from `current` to
// `next`. A slug whose relation changed appears in both `toRemove` and `toAdd`
// so callers can delete-then-insert it.
export function diffRuleLinks(
  current: CustomRuleLink[],
  next: CustomRuleLink[]
): { toAdd: CustomRuleLink[]; toRemove: CustomRuleLink[] } {
  const currentBySlug = new Map(current.map((l) => [l.ruleSlug, l]));
  const nextBySlug = new Map(next.map((l) => [l.ruleSlug, l]));
  return {
    toAdd: next.filter((l) => {
      const prev = currentBySlug.get(l.ruleSlug);
      return !prev || prev.relation !== l.relation;
    }),
    toRemove: current.filter((l) => {
      const now = nextBySlug.get(l.ruleSlug);
      return !now || now.relation !== l.relation;
    }),
  };
}

// --- Query layer ---

interface CustomRuleCreatorRow {
  id: string;
  discordId: string | null;
  username: string | null;
  displayName: string | null;
  imageUrl: string | null;
  avatar: string | null;
}

const customRuleCreatorColumns = {
  id: users.id,
  discordId: users.discordId,
  username: users.username,
  displayName: users.displayName,
  imageUrl: users.imageUrl,
  avatar: users.avatar,
};

interface CustomRuleFullData {
  rule: typeof customRules.$inferSelect;
  creator: CustomRuleCreatorRow;
  links: CustomRuleLink[];
}

const toCustomRule = (data: CustomRuleFullData): CustomRule => ({
  id: data.rule.id,
  name: data.rule.name,
  content: data.rule.content,
  keywords: data.rule.keywords,
  visibility: data.rule.visibility,
  likeCount: data.rule.likeCount,
  createdAt: data.rule.createdAt ? new Date(data.rule.createdAt) : new Date(),
  updatedAt: data.rule.updatedAt ? new Date(data.rule.updatedAt) : new Date(),
  links: data.links,
  creator: toUser(data.creator),
});

async function loadCustomRulesFullData(
  ruleIds?: string[],
  visibility?: CustomRuleVisibility,
  userId?: string
): Promise<Map<string, CustomRuleFullData>> {
  if (ruleIds?.length === 0) return new Map();
  const db = getDatabase();

  const ruleRows = await db
    .select({ rule: customRules, creator: customRuleCreatorColumns })
    .from(customRules)
    .innerJoin(users, eq(customRules.userId, users.id))
    .where(
      and(
        ruleIds ? inArray(customRules.id, ruleIds) : undefined,
        visibility ? eq(customRules.visibility, visibility) : undefined,
        userId ? eq(customRules.userId, userId) : undefined
      )
    )
    .orderBy(asc(customRules.name));

  const loadedIds = ruleRows.map(({ rule }) => rule.id);
  if (loadedIds.length === 0) return new Map();

  const linkRows = await db
    .select({
      customRuleId: customRuleLinks.customRuleId,
      ruleSlug: customRuleLinks.ruleSlug,
      relation: customRuleLinks.relation,
    })
    .from(customRuleLinks)
    .where(inArray(customRuleLinks.customRuleId, loadedIds));

  const linksByRule = new Map<string, CustomRuleLink[]>();
  for (const row of linkRows) {
    const existing = linksByRule.get(row.customRuleId) ?? [];
    existing.push({ ruleSlug: row.ruleSlug, relation: row.relation });
    linksByRule.set(row.customRuleId, existing);
  }

  const result = new Map<string, CustomRuleFullData>();
  for (const row of ruleRows) {
    const links = (linksByRule.get(row.rule.id) ?? []).sort((a, b) =>
      a.ruleSlug.localeCompare(b.ruleSlug)
    );
    result.set(row.rule.id, {
      rule: row.rule,
      creator: row.creator,
      links,
    });
  }
  return result;
}

export async function listPublicCustomRules(): Promise<CustomRule[]> {
  const map = await loadCustomRulesFullData(undefined, "public");
  return [...map.values()].map(toCustomRule);
}

export async function findCustomRule(id: string): Promise<CustomRule | null> {
  if (!isValidUUID(id)) return null;
  const map = await loadCustomRulesFullData([id]);
  const data = map.get(id);
  return data ? toCustomRule(data) : null;
}

export async function searchPublicCustomRules(
  query: string,
  limit = 8
): Promise<Pick<CustomRule, "id" | "name">[]> {
  const queryWords = tokenizeForSearch(query);
  if (queryWords.length === 0 || limit <= 0) return [];
  const result = await getClient().execute({
    sql: `
      SELECT custom_rules.id, custom_rules.name
      FROM custom_rules_fts
      JOIN custom_rules ON custom_rules.rowid = custom_rules_fts.rowid
      WHERE custom_rules.visibility = 'public'
        AND custom_rules_fts MATCH ?
      ORDER BY bm25(custom_rules_fts, 10.0, 1.0), custom_rules.name COLLATE NOCASE
      LIMIT ?
    `,
    args: [queryWords.map((word) => `${word}*`).join(" AND "), limit],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
  }));
}

export async function listCustomRulesForUser(
  userId: string
): Promise<CustomRule[]> {
  const map = await loadCustomRulesFullData(undefined, undefined, userId);
  return [...map.values()].map(toCustomRule);
}

export async function listPublicCustomRulesForUser(
  userId: string
): Promise<CustomRule[]> {
  const map = await loadCustomRulesFullData(undefined, "public", userId);
  return [...map.values()].map(toCustomRule);
}

export async function findPublicCustomRule(
  id: string
): Promise<CustomRule | null> {
  if (!isValidUUID(id)) return null;
  const map = await loadCustomRulesFullData([id], "public");
  const data = map.get(id);
  return data ? toCustomRule(data) : null;
}

// Public custom rules that replace or augment any of the given reference
// official rules, grouped by relation. Powers the reverse view on rule pages.
export async function listPublicCustomRulesForRules(
  ruleSlugs: string[]
): Promise<CustomRuleReverseGroups> {
  if (ruleSlugs.length === 0) return { replaces: [], augments: [] };
  const db = getDatabase();
  const rows = await db
    .select({
      id: customRules.id,
      name: customRules.name,
      relation: customRuleLinks.relation,
      creator: customRuleCreatorColumns,
    })
    .from(customRuleLinks)
    .innerJoin(customRules, eq(customRuleLinks.customRuleId, customRules.id))
    .innerJoin(users, eq(customRules.userId, users.id))
    .where(
      and(
        inArray(customRuleLinks.ruleSlug, ruleSlugs),
        eq(customRules.visibility, "public")
      )
    )
    .orderBy(asc(customRules.name));
  return groupCustomRuleReverseLinks(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      relation: row.relation,
      creator: toUser(row.creator),
    }))
  );
}

const toLinkInsert = (customRuleId: string, link: CustomRuleLink) => ({
  customRuleId,
  ruleSlug: link.ruleSlug,
  relation: link.relation,
});

interface CreateCustomRuleInput {
  userId: string;
  name: string;
  content: string;
  keywords: string;
  visibility: CustomRuleVisibility;
  links: CustomRuleLink[];
}

export async function createCustomRule(
  input: CreateCustomRuleInput
): Promise<CustomRule> {
  const name = input.name.trim();
  if (!name) throw new Error("Custom rule name is required");

  const links = validateRuleLinks(input.links, getValidRuleSlugs());
  const db = getDatabase();
  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(customRules).values({
      id,
      userId: input.userId,
      name,
      content: input.content,
      keywords: input.keywords.trim(),
      visibility: input.visibility,
    });
    if (links.length > 0) {
      await tx
        .insert(customRuleLinks)
        .values(links.map((link) => toLinkInsert(id, link)));
    }
  });

  const rule = await findCustomRule(id);
  if (!rule) throw new Error("Failed to create custom rule");
  return rule;
}

interface UpdateCustomRuleInput {
  id: string;
  userId: string;
  name: string;
  content: string;
  keywords: string;
  visibility: CustomRuleVisibility;
  links: CustomRuleLink[];
}

export async function updateCustomRule(
  input: UpdateCustomRuleInput
): Promise<CustomRule> {
  if (!isValidUUID(input.id)) throw new Error("Invalid custom rule ID");
  const name = input.name.trim();
  if (!name) throw new Error("Custom rule name is required");

  const nextLinks = validateRuleLinks(input.links, getValidRuleSlugs());
  const db = getDatabase();

  const existing = await db
    .select({ id: customRules.id })
    .from(customRules)
    .where(
      and(eq(customRules.id, input.id), eq(customRules.userId, input.userId))
    )
    .limit(1);
  if (existing.length === 0) throw new Error("Custom rule not found");

  const current: CustomRuleLink[] = await db
    .select({
      ruleSlug: customRuleLinks.ruleSlug,
      relation: customRuleLinks.relation,
    })
    .from(customRuleLinks)
    .where(eq(customRuleLinks.customRuleId, input.id));
  const { toAdd, toRemove } = diffRuleLinks(current, nextLinks);

  await db.transaction(async (tx) => {
    await tx
      .update(customRules)
      .set({
        name,
        content: input.content,
        keywords: input.keywords.trim(),
        visibility: input.visibility,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customRules.id, input.id));

    if (toRemove.length > 0) {
      await tx.delete(customRuleLinks).where(
        and(
          eq(customRuleLinks.customRuleId, input.id),
          inArray(
            customRuleLinks.ruleSlug,
            toRemove.map((l) => l.ruleSlug)
          )
        )
      );
    }
    if (toAdd.length > 0) {
      await tx
        .insert(customRuleLinks)
        .values(toAdd.map((link) => toLinkInsert(input.id, link)));
    }
  });

  const rule = await findCustomRule(input.id);
  if (!rule) throw new Error("Failed to update custom rule");
  return rule;
}

export async function deleteCustomRule(
  id: string,
  userId: string
): Promise<boolean> {
  if (!isValidUUID(id)) return false;
  const db = getDatabase();
  // custom_rule_links cascades on delete.
  const result = await db
    .delete(customRules)
    .where(and(eq(customRules.id, id), eq(customRules.userId, userId)));
  return result.rowsAffected > 0;
}
