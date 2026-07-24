import { and, asc, eq, inArray } from "drizzle-orm";
import { getValidSectionSlugs } from "@/lib/reference/filesystem";
import type { User } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type CustomRuleVisibility,
  customRules,
  type RelationType,
  relations,
  type UserRow,
  users,
} from "./schema";

// The relation kinds a custom rule may declare against a reference section.
export type CustomRuleSectionRelation = Extract<
  RelationType,
  "replaces" | "augments"
>;

export const DEFAULT_SECTION_RELATION: CustomRuleSectionRelation = "augments";

export interface CustomRuleSectionLink {
  sectionSlug: string;
  relation: CustomRuleSectionRelation;
}

export interface CustomRule {
  id: string;
  name: string;
  content: string;
  visibility: CustomRuleVisibility;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  links: CustomRuleSectionLink[];
  creator: User;
}

// --- Pure helpers (no DB / no filesystem access; unit-tested directly) ---

// Normalize and validate section links against the set of valid section slugs.
// Trims slugs, drops empties, defaults a missing relation to `augments`,
// dedupes by slug (order-preserving; first occurrence wins, which enforces that
// a section appears under a single relation), and throws if any slug is not a
// known reference section.
export function validateSectionLinks(
  links: { sectionSlug: string; relation?: CustomRuleSectionRelation }[],
  validSlugs: Iterable<string>
): CustomRuleSectionLink[] {
  const valid = new Set(validSlugs);
  const seen = new Set<string>();
  const result: CustomRuleSectionLink[] = [];
  const invalid: string[] = [];

  for (const raw of links) {
    const sectionSlug = raw.sectionSlug.trim();
    if (!sectionSlug || seen.has(sectionSlug)) continue;
    seen.add(sectionSlug);
    if (valid.has(sectionSlug)) {
      result.push({
        sectionSlug,
        relation: raw.relation ?? DEFAULT_SECTION_RELATION,
      });
    } else {
      invalid.push(sectionSlug);
    }
  }

  if (invalid.length > 0) {
    throw new Error(`Unknown reference section(s): ${invalid.join(", ")}`);
  }
  return result;
}

// Compute the minimal set of link inserts/deletes to move from `current` to
// `next`. A slug whose relation changed appears in both `toRemove` and `toAdd`
// so callers can delete-then-insert it.
export function diffSectionLinks(
  current: CustomRuleSectionLink[],
  next: CustomRuleSectionLink[]
): { toAdd: CustomRuleSectionLink[]; toRemove: CustomRuleSectionLink[] } {
  const currentBySlug = new Map(current.map((l) => [l.sectionSlug, l]));
  const nextBySlug = new Map(next.map((l) => [l.sectionSlug, l]));
  return {
    toAdd: next.filter((l) => {
      const prev = currentBySlug.get(l.sectionSlug);
      return !prev || prev.relation !== l.relation;
    }),
    toRemove: current.filter((l) => {
      const now = nextBySlug.get(l.sectionSlug);
      return !now || now.relation !== l.relation;
    }),
  };
}

// --- Query layer ---

interface CustomRuleFullData {
  rule: typeof customRules.$inferSelect;
  creator: UserRow;
  links: CustomRuleSectionLink[];
}

const toCustomRule = (data: CustomRuleFullData): CustomRule => ({
  id: data.rule.id,
  name: data.rule.name,
  content: data.rule.content,
  visibility: data.rule.visibility,
  likeCount: data.rule.likeCount,
  createdAt: data.rule.createdAt ? new Date(data.rule.createdAt) : new Date(),
  updatedAt: data.rule.updatedAt ? new Date(data.rule.updatedAt) : new Date(),
  links: data.links,
  creator: toUser(data.creator),
});

async function loadCustomRulesFullData(
  ruleIds: string[]
): Promise<Map<string, CustomRuleFullData>> {
  if (ruleIds.length === 0) return new Map();
  const db = getDatabase();

  const ruleRows = await db
    .select()
    .from(customRules)
    .innerJoin(users, eq(customRules.userId, users.id))
    .where(inArray(customRules.id, ruleIds));

  const relationRows = await db
    .select()
    .from(relations)
    .where(
      and(
        eq(relations.fromType, "custom_rule"),
        eq(relations.toType, "section"),
        inArray(relations.fromId, ruleIds)
      )
    );

  const linksByRule = new Map<string, CustomRuleSectionLink[]>();
  for (const row of relationRows) {
    if (row.relation !== "replaces" && row.relation !== "augments") continue;
    const existing = linksByRule.get(row.fromId) ?? [];
    existing.push({ sectionSlug: row.toId, relation: row.relation });
    linksByRule.set(row.fromId, existing);
  }

  const result = new Map<string, CustomRuleFullData>();
  for (const row of ruleRows) {
    const links = (linksByRule.get(row.custom_rules.id) ?? []).sort((a, b) =>
      a.sectionSlug.localeCompare(b.sectionSlug)
    );
    result.set(row.custom_rules.id, {
      rule: row.custom_rules,
      creator: row.users,
      links,
    });
  }
  return result;
}

export async function listPublicCustomRules(): Promise<CustomRule[]> {
  const db = getDatabase();
  const rows = await db
    .select({ id: customRules.id })
    .from(customRules)
    .where(eq(customRules.visibility, "public"))
    .orderBy(asc(customRules.name));

  const ids = rows.map((r) => r.id);
  const map = await loadCustomRulesFullData(ids);
  return ids
    .map((id) => map.get(id))
    .filter((d): d is CustomRuleFullData => d !== undefined)
    .map(toCustomRule);
}

export async function findCustomRule(id: string): Promise<CustomRule | null> {
  if (!isValidUUID(id)) return null;
  const map = await loadCustomRulesFullData([id]);
  const data = map.get(id);
  return data ? toCustomRule(data) : null;
}

export async function findPublicCustomRule(
  id: string
): Promise<CustomRule | null> {
  const rule = await findCustomRule(id);
  if (!rule || rule.visibility !== "public") return null;
  return rule;
}

const toRelationInsert = (ruleId: string, link: CustomRuleSectionLink) => ({
  fromType: "custom_rule" as const,
  fromId: ruleId,
  toType: "section" as const,
  toId: link.sectionSlug,
  relation: link.relation,
});

interface CreateCustomRuleInput {
  userId: string;
  name: string;
  content: string;
  visibility: CustomRuleVisibility;
  links: CustomRuleSectionLink[];
}

export async function createCustomRule(
  input: CreateCustomRuleInput
): Promise<CustomRule> {
  const name = input.name.trim();
  if (!name) throw new Error("Custom rule name is required");

  const links = validateSectionLinks(input.links, getValidSectionSlugs());
  const db = getDatabase();
  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(customRules).values({
      id,
      userId: input.userId,
      name,
      content: input.content,
      visibility: input.visibility,
    });
    if (links.length > 0) {
      await tx
        .insert(relations)
        .values(links.map((link) => toRelationInsert(id, link)));
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
  visibility: CustomRuleVisibility;
  links: CustomRuleSectionLink[];
}

export async function updateCustomRule(
  input: UpdateCustomRuleInput
): Promise<CustomRule> {
  if (!isValidUUID(input.id)) throw new Error("Invalid custom rule ID");
  const name = input.name.trim();
  if (!name) throw new Error("Custom rule name is required");

  const nextLinks = validateSectionLinks(input.links, getValidSectionSlugs());
  const db = getDatabase();

  const existing = await db
    .select({ id: customRules.id })
    .from(customRules)
    .where(
      and(eq(customRules.id, input.id), eq(customRules.userId, input.userId))
    )
    .limit(1);
  if (existing.length === 0) throw new Error("Custom rule not found");

  const currentRows = await db
    .select({ toId: relations.toId, relation: relations.relation })
    .from(relations)
    .where(
      and(
        eq(relations.fromType, "custom_rule"),
        eq(relations.fromId, input.id),
        eq(relations.toType, "section")
      )
    );
  const current: CustomRuleSectionLink[] = currentRows.flatMap((r) =>
    r.relation === "replaces" || r.relation === "augments"
      ? [{ sectionSlug: r.toId, relation: r.relation }]
      : []
  );
  const { toAdd, toRemove } = diffSectionLinks(current, nextLinks);

  await db.transaction(async (tx) => {
    await tx
      .update(customRules)
      .set({
        name,
        content: input.content,
        visibility: input.visibility,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customRules.id, input.id));

    if (toRemove.length > 0) {
      await tx.delete(relations).where(
        and(
          eq(relations.fromType, "custom_rule"),
          eq(relations.fromId, input.id),
          eq(relations.toType, "section"),
          inArray(
            relations.toId,
            toRemove.map((l) => l.sectionSlug)
          )
        )
      );
    }
    if (toAdd.length > 0) {
      await tx
        .insert(relations)
        .values(toAdd.map((link) => toRelationInsert(input.id, link)));
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
  const deleted = await db.transaction(async (tx) => {
    const result = await tx
      .delete(customRules)
      .where(and(eq(customRules.id, id), eq(customRules.userId, userId)));
    if (result.rowsAffected > 0) {
      await tx
        .delete(relations)
        .where(
          and(eq(relations.fromType, "custom_rule"), eq(relations.fromId, id))
        );
    }
    return result.rowsAffected > 0;
  });
  return deleted;
}
