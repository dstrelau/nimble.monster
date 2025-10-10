import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

describe("cursor encoding/decoding", () => {
  it("should encode and decode name cursor (ascending)", () => {
    const cursor = {
      sort: "name" as const,
      value: "Ancient Dragon",
      id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const encoded = encodeCursor(cursor);
    const decoded = decodeCursor(encoded);

    expect(decoded).toEqual(cursor);
  });

  it("should encode and decode name cursor (descending)", () => {
    const cursor = {
      sort: "-name" as const,
      value: "Ancient Dragon",
      id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const encoded = encodeCursor(cursor);
    const decoded = decodeCursor(encoded);

    expect(decoded).toEqual(cursor);
  });

  it("should encode and decode created_at cursor", () => {
    const cursor = {
      sort: "created_at" as const,
      value: "2025-01-01T00:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const encoded = encodeCursor(cursor);
    const decoded = decodeCursor(encoded);

    expect(decoded).toEqual(cursor);
  });

  it("should encode and decode level cursor", () => {
    const cursor = {
      sort: "level" as const,
      value: 10,
      id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const encoded = encodeCursor(cursor);
    const decoded = decodeCursor(encoded);

    expect(decoded).toEqual(cursor);
  });

  it("should return null for invalid cursor", () => {
    expect(decodeCursor("invalid")).toBeNull();
  });

  it("should return null for malformed base64", () => {
    expect(decodeCursor("!!!invalid!!!")).toBeNull();
  });

  it("should use base64url encoding (no padding)", () => {
    const cursor = {
      sort: "name" as const,
      value: "Test",
      id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const encoded = encodeCursor(cursor);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });
});
