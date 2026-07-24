import { and, asc, eq, inArray } from "drizzle-orm";
import { getAllReferenceSlugs } from "@/lib/reference/filesystem";
import type { User } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type CustomRuleVisibility,
  customRules,
  customRulesReferenceSections,
  type UserRow,
  users,
} from "./schema";

export interface CustomRule {
  id: string;
  name: string;
  content: string;
  visibility: CustomRuleVisibility;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  sectionSlugs: string[];
  creator: User;
}

// --- Pure helpers (no DB / no filesystem access; unit-tested directly) ---

// Strip an optional "#anchor" suffix, returning the base reference-entry slug.
// Supports finer-grained anchors stored in the same column (e.g. "movement#falling").
export function baseReferenceSlug(sectionSlug: string): string {
  const hash = sectionSlug.indexOf("#");
  return hash === -1 ? sectionSlug : sectionSlug.slice(0, hash);
}

// Normalize and validate section slugs against the set of valid reference
// slugs. Trims, drops empties, dedupes (order-preserving), and throws if any
// base slug is not a known reference entry.
export function validateSectionSlugs(
  sectionSlugs: string[],
  validSlugs: Iterable<string>
): string[] {
  const valid = new Set(validSlugs);
  const seen = new Set<string>();
  const result: string[] = [];
  const invalid: string[] = [];

  for (const raw of sectionSlugs) {
    const slug = raw.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    if (valid.has(baseReferenceSlug(slug))) {
      result.push(slug);
    } else {
      invalid.push(slug);
    }
  }

  if (invalid.length > 0) {
    throw new Error(`Unknown reference section(s): ${invalid.join(", ")}`);
  }
  return result;
}

// Compute the minimal set of link inserts/deletes to move from `current` to
// `next` section slugs.
export function diffSectionSlugs(
  current: string[],
  next: string[]
): { toAdd: string[]; toRemove: string[] } {
  const currentSet = new Set(current);
  const nextSet = new Set(next);
  return {
    toAdd: next.filter((slug) => !currentSet.has(slug)),
    toRemove: current.filter((slug) => !nextSet.has(slug)),
  };
}

// --- Query layer ---

interface CustomRuleFullData {
  rule: typeof customRules.$inferSelect;
  creator: UserRow;
  sectionSlugs: string[];
}

const toCustomRule = (data: CustomRuleFullData): CustomRule => ({
  id: data.rule.id,
  name: data.rule.name,
  content: data.rule.content,
  visibility: data.rule.visibility,
  likeCount: data.rule.likeCount,
  createdAt: data.rule.createdAt ? new Date(data.rule.createdAt) : new Date(),
  updatedAt: data.rule.updatedAt ? new Date(data.rule.updatedAt) : new Date(),
  sectionSlugs: data.sectionSlugs,
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

  const sectionRows = await db
    .select()
    .from(customRulesReferenceSections)
    .where(inArray(customRulesReferenceSections.customRuleId, ruleIds));

  const slugsByRule = new Map<string, string[]>();
  for (const row of sectionRows) {
    const existing = slugsByRule.get(row.customRuleId) ?? [];
    existing.push(row.referenceSlug);
    slugsByRule.set(row.customRuleId, existing);
  }

  const result = new Map<string, CustomRuleFullData>();
  for (const row of ruleRows) {
    result.set(row.custom_rules.id, {
      rule: row.custom_rules,
      creator: row.users,
      sectionSlugs: (slugsByRule.get(row.custom_rules.id) ?? []).sort(),
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

interface CreateCustomRuleInput {
  userId: string;
  name: string;
  content: string;
  visibility: CustomRuleVisibility;
  sectionSlugs: string[];
}

export async function createCustomRule(
  input: CreateCustomRuleInput
): Promise<CustomRule> {
  const name = input.name.trim();
  if (!name) throw new Error("Custom rule name is required");

  const slugs = validateSectionSlugs(
    input.sectionSlugs,
    getAllReferenceSlugs()
  );
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
    if (slugs.length > 0) {
      await tx
        .insert(customRulesReferenceSections)
        .values(
          slugs.map((referenceSlug) => ({ customRuleId: id, referenceSlug }))
        );
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
  sectionSlugs: string[];
}

export async function updateCustomRule(
  input: UpdateCustomRuleInput
): Promise<CustomRule> {
  if (!isValidUUID(input.id)) throw new Error("Invalid custom rule ID");
  const name = input.name.trim();
  if (!name) throw new Error("Custom rule name is required");

  const nextSlugs = validateSectionSlugs(
    input.sectionSlugs,
    getAllReferenceSlugs()
  );
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
    .select({ referenceSlug: customRulesReferenceSections.referenceSlug })
    .from(customRulesReferenceSections)
    .where(eq(customRulesReferenceSections.customRuleId, input.id));
  const { toAdd, toRemove } = diffSectionSlugs(
    currentRows.map((r) => r.referenceSlug),
    nextSlugs
  );

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
      await tx
        .delete(customRulesReferenceSections)
        .where(
          and(
            eq(customRulesReferenceSections.customRuleId, input.id),
            inArray(customRulesReferenceSections.referenceSlug, toRemove)
          )
        );
    }
    if (toAdd.length > 0) {
      await tx.insert(customRulesReferenceSections).values(
        toAdd.map((referenceSlug) => ({
          customRuleId: input.id,
          referenceSlug,
        }))
      );
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
  const result = await db
    .delete(customRules)
    .where(and(eq(customRules.id, id), eq(customRules.userId, userId)));
  return result.rowsAffected > 0;
}
