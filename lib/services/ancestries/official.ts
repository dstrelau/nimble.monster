import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import {
  type OfficialSource,
  validateOfficialSource,
} from "@/lib/services/validate-source";
import type { AncestrySize } from "./types";

export type { OfficialSource };
export { OFFICIAL_USER_ID };

export interface JSONAPIAncestry {
  type: "ancestries";
  id?: string;
  attributes: {
    name: string;
    size: AncestrySize[];
    rarity: "common" | "exotic";
    description: string;
    abilities: Array<{ name: string; description: string }>;
  };
}

export interface AncestrySessionData {
  ancestries: JSONAPIAncestry[];
  source?: OfficialSource;
}

export function validateOfficialAncestriesJSON(data: unknown): {
  ancestries: JSONAPIAncestry[];
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

  for (const [index, item] of dataField.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid ancestry at index ${index}: expected an object`);
    }

    if (!("type" in item) || item.type !== "ancestries") {
      throw new Error(
        `Invalid ancestry at index ${index}: type must be "ancestries"`
      );
    }

    if (!("attributes" in item) || typeof item.attributes !== "object") {
      throw new Error(
        `Invalid ancestry at index ${index}: missing or invalid attributes`
      );
    }

    const attrs = item.attributes as Record<string, unknown>;

    if (!attrs.name || typeof attrs.name !== "string") {
      throw new Error(
        `Invalid ancestry at index ${index}: missing or invalid name`
      );
    }

    if (!Array.isArray(attrs.size)) {
      throw new Error(
        `Invalid ancestry at index ${index} ("${attrs.name}"): size must be an array`
      );
    }

    for (const s of attrs.size) {
      if (typeof s !== "string") {
        throw new Error(
          `Invalid ancestry at index ${index} ("${attrs.name}"): each size must be a string`
        );
      }
    }

    if (attrs.rarity !== "common" && attrs.rarity !== "exotic") {
      throw new Error(
        `Invalid ancestry at index ${index} ("${attrs.name}"): rarity must be "common" or "exotic"`
      );
    }

    if (typeof attrs.description !== "string") {
      throw new Error(
        `Invalid ancestry at index ${index} ("${attrs.name}"): missing or invalid description`
      );
    }

    if (!Array.isArray(attrs.abilities)) {
      throw new Error(
        `Invalid ancestry at index ${index} ("${attrs.name}"): abilities must be an array`
      );
    }

    for (const [abilityIndex, ability] of (
      attrs.abilities as unknown[]
    ).entries()) {
      if (!ability || typeof ability !== "object") {
        throw new Error(
          `Invalid ancestry at index ${index} ("${attrs.name}"): ability at index ${abilityIndex} must be an object`
        );
      }
      const a = ability as Record<string, unknown>;
      if (!a.name || typeof a.name !== "string") {
        throw new Error(
          `Invalid ancestry at index ${index} ("${attrs.name}"): ability at index ${abilityIndex} missing or invalid name`
        );
      }
      if (typeof a.description !== "string") {
        throw new Error(
          `Invalid ancestry at index ${index} ("${attrs.name}"): ability at index ${abilityIndex} missing or invalid description`
        );
      }
    }
  }

  return { ancestries: dataField as JSONAPIAncestry[], source };
}
