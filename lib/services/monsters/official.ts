import { and, eq } from "drizzle-orm";
import type { JSONAPIFamily, JSONAPIMonster } from "@/lib/api/monsters";
import { getDatabase } from "@/lib/db/drizzle";
import { families } from "@/lib/db/schema";
import type { CreateMonsterInput } from "./types";

export const OFFICIAL_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function findOrCreateOfficialFamily(
  name: string,
  description: string | undefined,
  abilities: Array<{ name: string; description: string }>
): Promise<string> {
  const db = await getDatabase();

  const existingFamily = await db
    .select({ id: families.id })
    .from(families)
    .where(
      and(eq(families.name, name), eq(families.creatorId, OFFICIAL_USER_ID))
    )
    .limit(1);

  const abilitiesJson = JSON.stringify(
    abilities.map((a) => ({
      name: a.name,
      description: a.description,
    }))
  );

  if (existingFamily.length > 0) {
    await db
      .update(families)
      .set({
        description: description ?? null,
        abilities: abilitiesJson,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(families.id, existingFamily[0].id));
    return existingFamily[0].id;
  }

  const newFamilyId = crypto.randomUUID();
  await db.insert(families).values({
    id: newFamilyId,
    name,
    description: description ?? null,
    abilities: abilitiesJson,
    visibility: "public",
    creatorId: OFFICIAL_USER_ID,
  });

  return newFamilyId;
}

export function parseJSONAPIMonster(data: JSONAPIMonster): CreateMonsterInput {
  const attrs = data.attributes;

  const speeds = {
    speed: 0,
    fly: 0,
    swim: 0,
    climb: 0,
    burrow: 0,
    teleport: 0,
  };

  attrs.movement.forEach(
    (m: { speed: number } | { mode: string; speed: number }) => {
      if ("mode" in m) {
        speeds[m.mode as keyof typeof speeds] = m.speed;
      } else {
        speeds.speed = m.speed;
      }
    }
  );

  const actions = attrs.actions.map(
    (a: {
      name: string;
      description?: string;
      damage?: { roll: string };
      target?: { reach: number } | { range: number };
    }) => {
      const action: {
        id: string;
        name: string;
        description?: string;
        damage?: string;
        range?: string;
      } = {
        id: crypto.randomUUID(),
        name: a.name,
      };

      if (a.description) {
        action.description = a.description;
      }

      if (a.damage?.roll) {
        action.damage = a.damage.roll;
      }

      if (a.target && "reach" in a.target) {
        action.range = `${a.target.reach}ft`;
      } else if (a.target && "range" in a.target) {
        action.range = `${a.target.range}ft`;
      }

      return action;
    }
  );

  const abilities = attrs.abilities.map(
    (a: { name: string; description: string }) => ({
      id: crypto.randomUUID(),
      name: a.name,
      description: a.description,
    })
  );

  const levelInt =
    typeof attrs.level === "number"
      ? attrs.level
      : attrs.level === "1/4"
        ? -4
        : attrs.level === "1/3"
          ? -3
          : attrs.level === "1/2"
            ? -2
            : 1;

  return {
    name: attrs.name,
    hp: attrs.hp,
    level: String(attrs.level),
    levelInt,
    size: attrs.size as CreateMonsterInput["size"],
    armor:
      attrs.armor === "none"
        ? ""
        : (attrs.armor as CreateMonsterInput["armor"]),
    kind: attrs.kind,
    legendary: attrs.legendary,
    minion: attrs.minion ?? false,
    visibility: "public",
    paperforgeId: attrs.paperforgeId || null,
    ...speeds,
    abilities,
    actions,
    actionPreface: attrs.actionsInstructions || "",
    moreInfo: attrs.description,
    bloodied: attrs.bloodied?.description,
    lastStand: attrs.lastStand?.description,
  };
}

export interface OfficialMonstersSource {
  name: string;
  abbreviation: string;
  license: string;
  link: string;
}

export function validateOfficialMonstersJSON(data: unknown): {
  monsters: JSONAPIMonster[];
  families: Map<string, JSONAPIFamily>;
  source?: OfficialMonstersSource;
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON: expected an object");
  }

  if (!("data" in data)) {
    throw new Error("Invalid JSON: missing 'data' field");
  }

  const dataField = (data as { data: unknown }).data;

  let source: OfficialMonstersSource | undefined;
  const sourceField = (data as { source?: unknown }).source;
  if (sourceField) {
    if (typeof sourceField !== "object" || sourceField === null) {
      throw new Error("Invalid JSON: 'source' must be an object");
    }
    const s = sourceField as Record<string, unknown>;
    if (!s.name || typeof s.name !== "string") {
      throw new Error("Invalid source: missing or invalid 'name'");
    }
    if (!s.abbreviation || typeof s.abbreviation !== "string") {
      throw new Error("Invalid source: missing or invalid 'abbreviation'");
    }
    if (!s.license || typeof s.license !== "string") {
      throw new Error("Invalid source: missing or invalid 'license'");
    }
    if (!s.link || typeof s.link !== "string") {
      throw new Error("Invalid source: missing or invalid 'link'");
    }
    source = {
      name: s.name,
      abbreviation: s.abbreviation,
      license: s.license,
      link: s.link,
    };
  }

  if (!Array.isArray(dataField)) {
    throw new Error("Invalid JSON: 'data' must be an array");
  }

  if (dataField.length === 0) {
    throw new Error("Invalid JSON: 'data' array is empty");
  }

  const includedField = (data as { included?: unknown }).included;
  const familiesMap = new Map<string, JSONAPIFamily>();

  if (includedField) {
    if (!Array.isArray(includedField)) {
      throw new Error("Invalid JSON: 'included' must be an array if present");
    }

    for (const [index, item] of includedField.entries()) {
      if (!item || typeof item !== "object") {
        throw new Error(
          `Invalid included item at index ${index}: expected an object`
        );
      }

      if (!("type" in item) || item.type !== "families") {
        throw new Error(
          `Invalid included item at index ${index}: type must be "families"`
        );
      }

      if (!("id" in item) || typeof item.id !== "string") {
        throw new Error(
          `Invalid family at index ${index}: missing or invalid id`
        );
      }

      if (!("attributes" in item) || typeof item.attributes !== "object") {
        throw new Error(
          `Invalid family at index ${index}: missing or invalid attributes`
        );
      }

      const attrs = item.attributes as Record<string, unknown>;

      if (!attrs.name || typeof attrs.name !== "string") {
        throw new Error(
          `Invalid family at index ${index}: missing or invalid name`
        );
      }

      familiesMap.set(item.id as string, item as JSONAPIFamily);
    }
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  for (const [index, item] of dataField.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid monster at index ${index}: expected an object`);
    }

    if (!("type" in item) || item.type !== "monsters") {
      throw new Error(
        `Invalid monster at index ${index}: type must be "monsters"`
      );
    }

    if ("id" in item && item.id !== undefined) {
      if (typeof item.id !== "string") {
        throw new Error(
          `Invalid monster at index ${index}: id must be a string if provided`
        );
      }

      if (!uuidRegex.test(item.id as string)) {
        throw new Error(
          `Invalid monster at index ${index} ("${(item as { attributes?: { name?: string } }).attributes?.name || "unknown"}"): id must be a valid UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got "${item.id}"`
        );
      }
    }

    if (!("attributes" in item) || typeof item.attributes !== "object") {
      throw new Error(
        `Invalid monster at index ${index}: missing or invalid attributes`
      );
    }

    const attrs = item.attributes as Record<string, unknown>;

    if (!attrs.name || typeof attrs.name !== "string") {
      throw new Error(
        `Invalid monster at index ${index}: missing or invalid name`
      );
    }

    if (typeof attrs.hp !== "number") {
      throw new Error(
        `Invalid monster at index ${index} ("${attrs.name}"): missing or invalid hp`
      );
    }

    if (
      typeof attrs.level !== "number" &&
      attrs.level !== "1/4" &&
      attrs.level !== "1/3" &&
      attrs.level !== "1/2"
    ) {
      throw new Error(
        `Invalid monster at index ${index} ("${attrs.name}"): missing or invalid level`
      );
    }

    if ("relationships" in item && item.relationships) {
      const rels = item.relationships as Record<string, unknown>;
      if ("family" in rels && rels.family) {
        const familyRel = rels.family as Record<string, unknown>;
        if ("data" in familyRel && familyRel.data) {
          const familyData = familyRel.data as Record<string, unknown>;
          if (
            "id" in familyData &&
            typeof familyData.id === "string" &&
            !familiesMap.has(familyData.id)
          ) {
            throw new Error(
              `Invalid monster at index ${index} ("${attrs.name}"): references family "${familyData.id}" which is not in included array`
            );
          }
        }
      }
    }
  }

  const result = dataField as JSONAPIMonster[];

  for (const item of result) {
    if (!item.id) {
      item.id = crypto.randomUUID();
    }
  }

  return { monsters: result, families: familiesMap, source };
}
