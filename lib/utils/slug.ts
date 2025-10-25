export function slugify({ name, id }: { name: string; id: string }): string {
  return `${nameToKebabCase(name)}-${uuidToIdentifier(id)}`;
}

export function deslugify(slug: string): string | null {
  if (isUUID(slug)) {
    // fallback for legacy UUID URLs
    return slug;
  }
  try {
    // Extract the last 26 characters (the identifier)
    const identifier = slug.slice(-26);
    return identifierToUuid(identifier);
  } catch {
    return null;
  }
}

export function nameToKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Check if a parameter is a UUID vs slug
 */
export function isUUID(param: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    param
  );
}

/**
 * Convert UUID to 26-character base32 identifier using Crockford alphabet
 */
export function uuidToIdentifier(uuid: string): string {
  // Remove hyphens and convert to lowercase
  const hex = uuid.replace(/-/g, "").toLowerCase();

  // Convert hex string to BigInt to handle 128-bit precision
  const value = BigInt(`0x${hex}`);

  // Crockford base32 alphabet
  const alphabet = "0123456789abcdefghjkmnpqrstvwxyz";
  const base = BigInt(32);

  let result = "";
  let remaining = value;

  // Convert to base32, building from right to left
  for (let i = 0; i < 26; i++) {
    const digit = Number(remaining % base);
    result = alphabet[digit] + result;
    remaining = remaining / base;
  }

  return result;
}

/**
 * Convert 26-character base32 identifier back to UUID using Crockford alphabet
 */
export function identifierToUuid(identifier: string): string {
  if (identifier.length !== 26) {
    throw new Error("Identifier must be exactly 26 characters");
  }

  // Crockford base32 alphabet
  const alphabet = "0123456789abcdefghjkmnpqrstvwxyz";
  const base = BigInt(32);

  // Validate first character is 7 or less (prevents overflow)
  const firstChar = identifier[0];
  const firstCharIndex = alphabet.indexOf(firstChar);
  if (firstCharIndex > 7) {
    throw new Error(
      "Invalid identifier: first character exceeds maximum value"
    );
  }

  // Convert base32 string to BigInt
  let value = BigInt(0);
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier[i];
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid character in identifier: ${char}`);
    }
    value = value * base + BigInt(index);
  }

  // Convert BigInt to hex string (32 chars for 128 bits)
  const hex = value.toString(16).padStart(32, "0");

  // Format as UUID with hyphens
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Convert award abbreviation to URL-safe slug
 */
export function awardSlugify(abbreviation: string): string {
  return abbreviation
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
