import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import {
  type OfficialSource,
  validateOfficialSource,
} from "@/lib/services/validate-source";
import type { User } from "@/lib/types";

export type { OfficialSource };
export { OFFICIAL_USER_ID };

export const OFFICIAL_CREATOR: User = {
  id: OFFICIAL_USER_ID,
  discordId: "",
  username: "nimble-co",
  displayName: "Nimble Co.",
  imageUrl: "/images/nimble-n.png",
};

export interface JSONAPIClassAbility {
  name: string;
  description: string;
}

export interface JSONAPIClassLevel {
  level: number;
  abilities: JSONAPIClassAbility[];
}

export interface JSONAPIClassAbilityListItem {
  name: string;
  description: string;
}

export interface JSONAPIClassAbilityList {
  name: string;
  description: string;
  items: JSONAPIClassAbilityListItem[];
}

export interface JSONAPIClass {
  type: "classes";
  id?: string;
  attributes: {
    name: string;
    description: string;
    keyStats: string[];
    hitDie: string;
    startingHp: number;
    saves: Record<string, number>;
    armor: string[];
    weapons: object;
    startingGear: string[];
    levels: JSONAPIClassLevel[];
    abilityLists: JSONAPIClassAbilityList[];
  };
}

export interface ClassSessionData {
  classes: JSONAPIClass[];
  source?: OfficialSource;
}

export function validateOfficialClassesJSON(data: unknown): {
  classes: JSONAPIClass[];
  source?: OfficialSource;
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON: expected an object");
  }

  if (!("data" in data)) {
    throw new Error("Invalid JSON: missing 'data' field");
  }

  const dataField = (data as { data: unknown }).data;
  const source = validateOfficialSource((data as { source?: unknown }).source);

  if (!Array.isArray(dataField)) {
    throw new Error("Invalid JSON: 'data' must be an array");
  }

  if (dataField.length === 0) {
    throw new Error("Invalid JSON: 'data' array is empty");
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  for (const [index, item] of dataField.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid class at index ${index}: expected an object`);
    }

    if (!("type" in item) || item.type !== "classes") {
      throw new Error(
        `Invalid class at index ${index}: type must be "classes"`
      );
    }

    if ("id" in item && item.id !== undefined) {
      if (typeof item.id !== "string") {
        throw new Error(
          `Invalid class at index ${index}: id must be a string if provided`
        );
      }

      if (!uuidRegex.test(item.id)) {
        throw new Error(
          `Invalid class at index ${index} ("${(item as { attributes?: { name?: string } }).attributes?.name || "unknown"}"): id must be a valid UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got "${item.id}"`
        );
      }
    }

    if (!("attributes" in item) || typeof item.attributes !== "object") {
      throw new Error(
        `Invalid class at index ${index}: missing or invalid attributes`
      );
    }

    const attrs = item.attributes as Record<string, unknown>;

    if (!attrs.name || typeof attrs.name !== "string") {
      throw new Error(
        `Invalid class at index ${index}: missing or invalid name`
      );
    }

    if (!attrs.description || typeof attrs.description !== "string") {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid description`
      );
    }

    if (!Array.isArray(attrs.keyStats)) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid keyStats`
      );
    }

    for (const [ki, ks] of (attrs.keyStats as unknown[]).entries()) {
      if (typeof ks !== "string") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): keyStats[${ki}] must be a string`
        );
      }
    }

    if (!attrs.hitDie || typeof attrs.hitDie !== "string") {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid hitDie`
      );
    }

    if (typeof attrs.startingHp !== "number") {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid startingHp`
      );
    }

    if (
      !attrs.saves ||
      typeof attrs.saves !== "object" ||
      Array.isArray(attrs.saves)
    ) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid saves`
      );
    }

    if (!Array.isArray(attrs.armor)) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid armor`
      );
    }

    for (const [ai, a] of (attrs.armor as unknown[]).entries()) {
      if (typeof a !== "string") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): armor[${ai}] must be a string`
        );
      }
    }

    if (
      !attrs.weapons ||
      typeof attrs.weapons !== "object" ||
      Array.isArray(attrs.weapons)
    ) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid weapons`
      );
    }

    if (!Array.isArray(attrs.startingGear)) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid startingGear`
      );
    }

    for (const [gi, g] of (attrs.startingGear as unknown[]).entries()) {
      if (typeof g !== "string") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): startingGear[${gi}] must be a string`
        );
      }
    }

    if (!Array.isArray(attrs.levels)) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid levels`
      );
    }

    for (const [levelIndex, level] of (
      attrs.levels as Array<unknown>
    ).entries()) {
      if (!level || typeof level !== "object") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): level at index ${levelIndex} must be an object`
        );
      }

      const lvl = level as Record<string, unknown>;

      if (typeof lvl.level !== "number") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): level at index ${levelIndex} missing or invalid level number`
        );
      }

      if (!Array.isArray(lvl.abilities)) {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): level at index ${levelIndex} missing or invalid abilities`
        );
      }

      for (const [abilityIndex, ability] of (
        lvl.abilities as Array<unknown>
      ).entries()) {
        if (!ability || typeof ability !== "object") {
          throw new Error(
            `Invalid class at index ${index} ("${attrs.name}"): ability at level ${lvl.level} index ${abilityIndex} must be an object`
          );
        }

        const ab = ability as Record<string, unknown>;

        if (!ab.name || typeof ab.name !== "string") {
          throw new Error(
            `Invalid class at index ${index} ("${attrs.name}"): ability at level ${lvl.level} index ${abilityIndex} missing or invalid name`
          );
        }

        if (!ab.description || typeof ab.description !== "string") {
          throw new Error(
            `Invalid class at index ${index} ("${attrs.name}"): ability at level ${lvl.level} index ${abilityIndex} missing or invalid description`
          );
        }
      }
    }

    if (!Array.isArray(attrs.abilityLists)) {
      throw new Error(
        `Invalid class at index ${index} ("${attrs.name}"): missing or invalid abilityLists`
      );
    }

    for (const [listIndex, list] of (
      attrs.abilityLists as Array<unknown>
    ).entries()) {
      if (!list || typeof list !== "object") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): abilityList at index ${listIndex} must be an object`
        );
      }

      const al = list as Record<string, unknown>;

      if (!al.name || typeof al.name !== "string") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): abilityList at index ${listIndex} missing or invalid name`
        );
      }

      if (!al.description || typeof al.description !== "string") {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): abilityList at index ${listIndex} missing or invalid description`
        );
      }

      if (!Array.isArray(al.items)) {
        throw new Error(
          `Invalid class at index ${index} ("${attrs.name}"): abilityList at index ${listIndex} missing or invalid items`
        );
      }

      for (const [itemIndex, listItem] of (
        al.items as Array<unknown>
      ).entries()) {
        if (!listItem || typeof listItem !== "object") {
          throw new Error(
            `Invalid class at index ${index} ("${attrs.name}"): abilityList "${al.name}" item at index ${itemIndex} must be an object`
          );
        }

        const li = listItem as Record<string, unknown>;

        if (!li.name || typeof li.name !== "string") {
          throw new Error(
            `Invalid class at index ${index} ("${attrs.name}"): abilityList "${al.name}" item at index ${itemIndex} missing or invalid name`
          );
        }

        if (!li.description || typeof li.description !== "string") {
          throw new Error(
            `Invalid class at index ${index} ("${attrs.name}"): abilityList "${al.name}" item at index ${itemIndex} missing or invalid description`
          );
        }
      }
    }
  }

  const result = dataField as JSONAPIClass[];

  for (const item of result) {
    if (!item.id) {
      item.id = crypto.randomUUID();
    }
  }

  return { classes: result, source };
}
