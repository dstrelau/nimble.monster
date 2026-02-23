import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import {
  type OfficialSource,
  validateOfficialSource,
} from "@/lib/services/validate-source";

export type { OfficialSource };
export { OFFICIAL_USER_ID };

export interface JSONAPISubclassAbility {
  name: string;
  description: string;
}

export interface JSONAPISubclassLevel {
  level: number;
  abilities: JSONAPISubclassAbility[];
}

export interface JSONAPISubclass {
  type: "subclasses";
  id?: string;
  attributes: {
    name: string;
    className: string;
    tagline?: string;
    description?: string;
    levels: JSONAPISubclassLevel[];
  };
}

export interface SubclassSessionData {
  subclasses: JSONAPISubclass[];
  source?: OfficialSource;
}

export function validateOfficialSubclassesJSON(data: unknown): {
  subclasses: JSONAPISubclass[];
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
      throw new Error(`Invalid subclass at index ${index}: expected an object`);
    }

    if (!("type" in item) || item.type !== "subclasses") {
      throw new Error(
        `Invalid subclass at index ${index}: type must be "subclasses"`
      );
    }

    if ("id" in item && item.id !== undefined) {
      if (typeof item.id !== "string") {
        throw new Error(
          `Invalid subclass at index ${index}: id must be a string if provided`
        );
      }

      if (!uuidRegex.test(item.id)) {
        throw new Error(
          `Invalid subclass at index ${index} ("${(item as { attributes?: { name?: string } }).attributes?.name || "unknown"}"): id must be a valid UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got "${item.id}"`
        );
      }
    }

    if (!("attributes" in item) || typeof item.attributes !== "object") {
      throw new Error(
        `Invalid subclass at index ${index}: missing or invalid attributes`
      );
    }

    const attrs = item.attributes as Record<string, unknown>;

    if (!attrs.name || typeof attrs.name !== "string") {
      throw new Error(
        `Invalid subclass at index ${index}: missing or invalid name`
      );
    }

    if (!attrs.className || typeof attrs.className !== "string") {
      throw new Error(
        `Invalid subclass at index ${index} ("${attrs.name}"): missing or invalid className`
      );
    }

    if (attrs.tagline !== undefined && typeof attrs.tagline !== "string") {
      throw new Error(
        `Invalid subclass at index ${index} ("${attrs.name}"): tagline must be a string`
      );
    }

    if (
      attrs.description !== undefined &&
      typeof attrs.description !== "string"
    ) {
      throw new Error(
        `Invalid subclass at index ${index} ("${attrs.name}"): description must be a string`
      );
    }

    if (!Array.isArray(attrs.levels)) {
      throw new Error(
        `Invalid subclass at index ${index} ("${attrs.name}"): missing or invalid levels`
      );
    }

    for (const [levelIndex, level] of (
      attrs.levels as Array<unknown>
    ).entries()) {
      if (!level || typeof level !== "object") {
        throw new Error(
          `Invalid subclass at index ${index} ("${attrs.name}"): level at index ${levelIndex} must be an object`
        );
      }

      const lvl = level as Record<string, unknown>;

      if (typeof lvl.level !== "number") {
        throw new Error(
          `Invalid subclass at index ${index} ("${attrs.name}"): level at index ${levelIndex} missing or invalid level number`
        );
      }

      if (!Array.isArray(lvl.abilities)) {
        throw new Error(
          `Invalid subclass at index ${index} ("${attrs.name}"): level at index ${levelIndex} missing or invalid abilities`
        );
      }

      for (const [abilityIndex, ability] of (
        lvl.abilities as Array<unknown>
      ).entries()) {
        if (!ability || typeof ability !== "object") {
          throw new Error(
            `Invalid subclass at index ${index} ("${attrs.name}"): ability at level ${lvl.level} index ${abilityIndex} must be an object`
          );
        }

        const ab = ability as Record<string, unknown>;

        if (!ab.name || typeof ab.name !== "string") {
          throw new Error(
            `Invalid subclass at index ${index} ("${attrs.name}"): ability at level ${lvl.level} index ${abilityIndex} missing or invalid name`
          );
        }

        if (!ab.description || typeof ab.description !== "string") {
          throw new Error(
            `Invalid subclass at index ${index} ("${attrs.name}"): ability at level ${lvl.level} index ${abilityIndex} missing or invalid description`
          );
        }
      }
    }
  }

  const result = dataField as JSONAPISubclass[];

  for (const item of result) {
    if (!item.id) {
      item.id = crypto.randomUUID();
    }
  }

  return { subclasses: result, source };
}
