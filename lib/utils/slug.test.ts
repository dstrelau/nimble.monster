import { describe, expect, it } from "vitest";
import {
  deslugify,
  identifierToUuid,
  isUUID,
  nameToKebabCase,
  slugify,
  uuidToIdentifier,
} from "./slug";

describe("nameToKebabCase", () => {
  it("should convert simple names to kebab-case", () => {
    expect(nameToKebabCase("Simple Name")).toBe("simple-name");
    expect(nameToKebabCase("UPPERCASE")).toBe("uppercase");
    expect(nameToKebabCase("lowercase")).toBe("lowercase");
  });

  it("should handle special characters", () => {
    expect(nameToKebabCase("Name with @#$% chars")).toBe("name-with-chars");
    expect(nameToKebabCase("Multiple   spaces")).toBe("multiple-spaces");
    expect(nameToKebabCase("--Leading--and--trailing--")).toBe(
      "leading-and-trailing"
    );
  });

  it("should handle edge cases", () => {
    expect(nameToKebabCase("")).toBe("");
    expect(nameToKebabCase("123")).toBe("123");
    expect(nameToKebabCase("a")).toBe("a");
  });
});

describe("isUUID", () => {
  it("should validate correct UUID format", () => {
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
    expect(isUUID("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF")).toBe(true);
  });

  it("should reject invalid UUID formats", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("550e8400-e29b-41d4-a716-44665544000")).toBe(false); // missing char
    expect(isUUID("550e8400-e29b-41d4-a716-4466554400000")).toBe(false); // extra char
    expect(isUUID("")).toBe(false);
  });
});

describe("uuidToIdentifier", () => {
  it("should convert UUID to 26-character identifier", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const identifier = uuidToIdentifier(uuid);
    expect(identifier).toHaveLength(26);
    expect(identifier).toMatch(/^[0-7][0-9a-z]*$/); // First char 0-7, rest valid base32
  });

  it("should handle all-zero UUID", () => {
    const uuid = "00000000-0000-0000-0000-000000000000";
    const identifier = uuidToIdentifier(uuid);
    expect(identifier).toBe("00000000000000000000000000");
  });

  it("should handle maximum UUID value", () => {
    const uuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const identifier = uuidToIdentifier(uuid);
    expect(identifier).toHaveLength(26);
    expect(identifier[0]).toBe("7"); // Should start with 7 for max value
  });

  it("should handle mixed case UUIDs", () => {
    const uuid1 = "550E8400-E29B-41D4-A716-446655440000";
    const uuid2 = "550e8400-e29b-41d4-a716-446655440000";
    expect(uuidToIdentifier(uuid1)).toBe(uuidToIdentifier(uuid2));
  });

  it("should only use valid base32 characters", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const identifier = uuidToIdentifier(uuid);
    expect(identifier).toMatch(/^[0123456789abcdefghjkmnpqrstvwxyz]+$/);
  });
});

describe("identifierToUuid", () => {
  it("should convert 26-character identifier back to UUID", () => {
    const originalUuid = "550e8400-e29b-41d4-a716-446655440000";
    const identifier = uuidToIdentifier(originalUuid);
    const convertedUuid = identifierToUuid(identifier);
    expect(convertedUuid).toBe(originalUuid);
  });

  it("should handle all-zero identifier", () => {
    const identifier = "00000000000000000000000000";
    const uuid = identifierToUuid(identifier);
    expect(uuid).toBe("00000000-0000-0000-0000-000000000000");
  });

  it("should handle maximum valid identifier", () => {
    const identifier = "7zzzzzzzzzzzzzzzzzzzzzzzzz";
    const uuid = identifierToUuid(identifier);
    expect(uuid).toBe("ffffffff-ffff-ffff-ffff-ffffffffffff");
  });

  it("should reject identifiers with wrong length", () => {
    expect(() => identifierToUuid("short")).toThrow(
      "Identifier must be exactly 26 characters"
    );
    expect(() =>
      identifierToUuid("toolongidentifierthatexceeds26chars")
    ).toThrow("Identifier must be exactly 26 characters");
  });

  it("should reject identifiers starting with 8 or higher", () => {
    expect(() => identifierToUuid("8zzzzzzzzzzzzzzzzzzzzzzzzz")).toThrow(
      "Invalid identifier: first character exceeds maximum value"
    );
    expect(() => identifierToUuid("9zzzzzzzzzzzzzzzzzzzzzzzzz")).toThrow(
      "Invalid identifier: first character exceeds maximum value"
    );
    expect(() => identifierToUuid("azzzzzzzzzzzzzzzzzzzzzzzzz")).toThrow(
      "Invalid identifier: first character exceeds maximum value"
    );
  });

  it("should reject identifiers with invalid characters", () => {
    expect(() => identifierToUuid("0000000000000000000000000i")).toThrow(
      "Invalid character in identifier: i"
    );
    expect(() => identifierToUuid("0000000000000000000000000l")).toThrow(
      "Invalid character in identifier: l"
    );
    expect(() => identifierToUuid("0000000000000000000000000o")).toThrow(
      "Invalid character in identifier: o"
    );
    expect(() => identifierToUuid("0000000000000000000000000u")).toThrow(
      "Invalid character in identifier: u"
    );
  });
});

describe("slugify", () => {
  it("should create slug with name and encoded UUID", () => {
    const name = "Kobold Warrior";
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const slug = slugify({ name, id });

    expect(slug).toMatch(/^kobold-warrior-[0-9a-z]{26}$/);
    expect(slug.startsWith("kobold-warrior-")).toBe(true);
    expect(slug.length).toBe("kobold-warrior-".length + 26);
  });

  it("should handle complex names", () => {
    const name = "Ancient Red Dragon (Adult)";
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const slug = slugify({ name, id });

    expect(slug).toMatch(/^ancient-red-dragon-adult-[0-9a-z]{26}$/);
  });

  it("should handle special characters in names", () => {
    const name = "Fire Elemental @#$% & Stuff!!!";
    const id = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const slug = slugify({ name, id });

    expect(slug).toMatch(/^fire-elemental-stuff-[0-9a-z]{26}$/);
  });

  it("should produce deterministic results", () => {
    const name = "Test Monster";
    const id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const slug1 = slugify({ name, id });
    const slug2 = slugify({ name, id });

    expect(slug1).toBe(slug2);
  });
});

describe("deslugify", () => {
  it("should extract UUID from slug", () => {
    const originalId = "550e8400-e29b-41d4-a716-446655440000";
    const slug = slugify({ name: "Kobold Warrior", id: originalId });
    const extractedId = deslugify(slug);

    expect(extractedId).toBe(originalId);
  });

  it("should handle legacy UUID format as fallback", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const result = deslugify(uuid);

    expect(result).toBe(uuid);
  });

  it("should work with complex slugs", () => {
    const originalId = "123e4567-e89b-12d3-a456-426614174000";
    const slug = slugify({
      name: "Ancient Red Dragon (Adult)",
      id: originalId,
    });
    const extractedId = deslugify(slug);

    expect(extractedId).toBe(originalId);
  });

  it("should handle edge case UUIDs", () => {
    const testCases = [
      "00000000-0000-0000-0000-000000000000",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    ];

    testCases.forEach((originalId) => {
      const slug = slugify({ name: "Test Monster", id: originalId });
      const extractedId = deslugify(slug);
      expect(extractedId).toBe(originalId);
    });
  });
});

describe("slugify and deslugify round-trip", () => {
  const testCases = [
    { name: "Kobold Warrior", id: "550e8400-e29b-41d4-a716-446655440000" },
    { name: "Ancient Red Dragon", id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" },
    { name: "Fire Elemental", id: "123e4567-e89b-12d3-a456-426614174000" },
    { name: "Simple", id: "00000000-0000-0000-0000-000000000000" },
    { name: "Maximum Value", id: "ffffffff-ffff-ffff-ffff-ffffffffffff" },
  ];

  it("should maintain UUID integrity through slug round-trip", () => {
    testCases.forEach(({ name, id }) => {
      const slug = slugify({ name, id });
      const extractedId = deslugify(slug);
      expect(extractedId).toBe(id);
    });
  });

  it("should produce URL-friendly slugs", () => {
    testCases.forEach(({ name, id }) => {
      const slug = slugify({ name, id });
      // Should only contain lowercase letters, numbers, and hyphens
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      // Should not have consecutive hyphens
      expect(slug).not.toMatch(/--+/);
      // Should not start or end with hyphen
      expect(slug).not.toMatch(/^-|-$/);
    });
  });
});

describe("uuidToIdentifier and identifierToUuid round-trip", () => {
  const testUuids = [
    "00000000-0000-0000-0000-000000000000",
    "550e8400-e29b-41d4-a716-446655440000",
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "123e4567-e89b-12d3-a456-426614174000",
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  ];

  it("should maintain UUID integrity through round-trip conversion", () => {
    testUuids.forEach((uuid) => {
      const identifier = uuidToIdentifier(uuid);
      const convertedUuid = identifierToUuid(identifier);
      expect(convertedUuid).toBe(uuid);
    });
  });

  it("should produce consistent identifiers for the same UUID", () => {
    testUuids.forEach((uuid) => {
      const identifier1 = uuidToIdentifier(uuid);
      const identifier2 = uuidToIdentifier(uuid);
      expect(identifier1).toBe(identifier2);
    });
  });
});
