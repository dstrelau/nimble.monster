#!/usr/bin/env -S pnpm exec ts-node --esm

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

function identifierToUuid(identifier: string): string {
  if (identifier.length !== 26) {
    throw new Error("Identifier must be exactly 26 characters");
  }

  const base = BigInt(32);
  const firstCharIndex = ALPHABET.indexOf(identifier[0]);
  if (firstCharIndex > 7) {
    throw new Error(
      "Invalid identifier: first character exceeds maximum value"
    );
  }

  let value = BigInt(0);
  for (let i = 0; i < identifier.length; i++) {
    const index = ALPHABET.indexOf(identifier[i]);
    if (index === -1) {
      throw new Error(`Invalid character in identifier: ${identifier[i]}`);
    }
    value = value * base + BigInt(index);
  }

  const hex = value.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function isUUID(param: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    param
  );
}

const input = process.argv[2];

if (!input) {
  console.error("Usage: slug-to-uuid <slug-or-identifier>");
  process.exit(1);
}

// If already a UUID, just echo it
if (isUUID(input)) {
  console.log(input);
  process.exit(0);
}

// Extract 26-char identifier from end of slug
const identifier = input.slice(-26);

try {
  console.log(identifierToUuid(identifier));
} catch (e) {
  console.error(e instanceof Error ? e.message : "Could not parse input");
  process.exit(1);
}
