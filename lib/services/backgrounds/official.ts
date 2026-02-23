import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import {
  type OfficialSource,
  validateOfficialSource,
} from "@/lib/services/validate-source";

export type { OfficialSource };
export { OFFICIAL_USER_ID };

export interface JSONAPIBackground {
  type: "backgrounds";
  id?: string;
  attributes: {
    name: string;
    description: string;
    requirement?: string;
  };
}

export interface BackgroundSessionData {
  backgrounds: JSONAPIBackground[];
  source?: OfficialSource;
}

export function validateOfficialBackgroundsJSON(data: unknown): {
  backgrounds: JSONAPIBackground[];
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
      throw new Error(
        `Invalid background at index ${index}: expected an object`
      );
    }

    if (!("type" in item) || item.type !== "backgrounds") {
      throw new Error(
        `Invalid background at index ${index}: type must be "backgrounds"`
      );
    }

    if (!("attributes" in item) || typeof item.attributes !== "object") {
      throw new Error(
        `Invalid background at index ${index}: missing or invalid attributes`
      );
    }

    const attrs = item.attributes as Record<string, unknown>;

    if (!attrs.name || typeof attrs.name !== "string") {
      throw new Error(
        `Invalid background at index ${index}: missing or invalid name`
      );
    }

    if (!attrs.description || typeof attrs.description !== "string") {
      throw new Error(
        `Invalid background at index ${index} ("${attrs.name}"): missing or invalid description`
      );
    }

    if (
      attrs.requirement !== undefined &&
      typeof attrs.requirement !== "string"
    ) {
      throw new Error(
        `Invalid background at index ${index} ("${attrs.name}"): requirement must be a string`
      );
    }
  }

  return { backgrounds: dataField as JSONAPIBackground[], source };
}
