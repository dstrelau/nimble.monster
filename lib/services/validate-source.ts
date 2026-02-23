export interface OfficialSource {
  name: string;
  abbreviation: string;
  license: string;
  link: string;
}

export function validateOfficialSource(
  sourceField: unknown
): OfficialSource | undefined {
  if (!sourceField) return undefined;

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
  return {
    name: s.name,
    abbreviation: s.abbreviation,
    license: s.license,
    link: s.link,
  };
}
