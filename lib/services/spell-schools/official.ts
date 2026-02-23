import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import {
  type OfficialSource,
  validateOfficialSource,
} from "@/lib/services/validate-source";

export type { OfficialSource };
export { OFFICIAL_USER_ID };

export interface JSONAPISpellTarget {
  type: "self" | "single" | "single+" | "multi" | "aoe" | "special";
  kind?: "range" | "reach" | "line" | "cone";
  distance?: number;
}

export interface JSONAPISpell {
  name: string;
  tier: number;
  actions: number;
  reaction?: boolean;
  utility?: boolean;
  target?: JSONAPISpellTarget;
  damage?: string;
  description?: string;
  highLevels?: string;
  concentration?: string;
  upcast?: string;
}

export interface JSONAPISpellSchool {
  type: "spell-schools";
  id?: string;
  attributes: {
    name: string;
    description?: string;
    spells: JSONAPISpell[];
  };
}

export interface SpellSchoolSessionData {
  spellSchools: JSONAPISpellSchool[];
  source?: OfficialSource;
}

export function validateOfficialSpellSchoolsJSON(data: unknown): {
  spellSchools: JSONAPISpellSchool[];
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
      throw new Error(
        `Invalid spell school at index ${index}: expected an object`
      );
    }

    if (!("type" in item) || item.type !== "spell-schools") {
      throw new Error(
        `Invalid spell school at index ${index}: type must be "spell-schools"`
      );
    }

    if ("id" in item && item.id !== undefined) {
      if (typeof item.id !== "string") {
        throw new Error(
          `Invalid spell school at index ${index}: id must be a string if provided`
        );
      }

      if (!uuidRegex.test(item.id)) {
        throw new Error(
          `Invalid spell school at index ${index} ("${(item as { attributes?: { name?: string } }).attributes?.name || "unknown"}"): id must be a valid UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got "${item.id}"`
        );
      }
    }

    if (!("attributes" in item) || typeof item.attributes !== "object") {
      throw new Error(
        `Invalid spell school at index ${index}: missing or invalid attributes`
      );
    }

    const attrs = item.attributes as Record<string, unknown>;

    if (!attrs.name || typeof attrs.name !== "string") {
      throw new Error(
        `Invalid spell school at index ${index}: missing or invalid name`
      );
    }

    if (
      attrs.description !== undefined &&
      typeof attrs.description !== "string"
    ) {
      throw new Error(
        `Invalid spell school at index ${index} ("${attrs.name}"): description must be a string`
      );
    }

    if (!Array.isArray(attrs.spells)) {
      throw new Error(
        `Invalid spell school at index ${index} ("${attrs.name}"): missing or invalid spells`
      );
    }

    if ((attrs.spells as Array<unknown>).length === 0) {
      throw new Error(
        `Invalid spell school at index ${index} ("${attrs.name}"): spells array is empty`
      );
    }

    for (const [spellIndex, spell] of (
      attrs.spells as Array<unknown>
    ).entries()) {
      if (!spell || typeof spell !== "object") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell at index ${spellIndex} must be an object`
        );
      }

      const sp = spell as Record<string, unknown>;

      if (!sp.name || typeof sp.name !== "string") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell at index ${spellIndex} missing or invalid name`
        );
      }

      if (typeof sp.tier !== "number") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" missing or invalid tier`
        );
      }

      if (typeof sp.actions !== "number") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" missing or invalid actions`
        );
      }

      if (sp.reaction !== undefined && typeof sp.reaction !== "boolean") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" reaction must be a boolean`
        );
      }

      if (sp.target !== undefined) {
        if (!sp.target || typeof sp.target !== "object") {
          throw new Error(
            `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" target must be an object`
          );
        }

        const target = sp.target as Record<string, unknown>;

        if (!target.type || typeof target.type !== "string") {
          throw new Error(
            `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" target missing or invalid type`
          );
        }
      }

      if (sp.damage !== undefined && typeof sp.damage !== "string") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" damage must be a string`
        );
      }

      if (sp.description !== undefined && typeof sp.description !== "string") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" description must be a string`
        );
      }

      if (sp.highLevels !== undefined && typeof sp.highLevels !== "string") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" highLevels must be a string`
        );
      }

      if (
        sp.concentration !== undefined &&
        typeof sp.concentration !== "string"
      ) {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" concentration must be a string`
        );
      }

      if (sp.upcast !== undefined && typeof sp.upcast !== "string") {
        throw new Error(
          `Invalid spell school at index ${index} ("${attrs.name}"): spell "${sp.name}" upcast must be a string`
        );
      }
    }
  }

  const result = dataField as JSONAPISpellSchool[];

  for (const item of result) {
    if (!item.id) {
      item.id = crypto.randomUUID();
    }
  }

  return { spellSchools: result, source };
}
