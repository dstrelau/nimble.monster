import { describe, expect, it } from "vitest";
import { allowAccessToCollection } from "./repository";

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
};

describe("allowAccessToCollection", () => {
  it("returns true for public collection regardless of discordId", () => {
    const collection = {
      visibility: "public" as const,
      creator: fakeCreator,
    };
    expect(allowAccessToCollection(collection, undefined)).toBe(true);
    expect(allowAccessToCollection(collection, fakeCreator.discordId)).toBe(true);
    expect(allowAccessToCollection(collection, "other")).toBe(true);
  });

  it("returns true for private collection when discordId matches creator", () => {
    const collection = {
      visibility: "private" as const,
      creator: fakeCreator,
    };
    expect(allowAccessToCollection(collection, fakeCreator.discordId)).toBe(true);
  });

  it("returns false for private collection when discordId is undefined", () => {
    const collection = {
      visibility: "private" as const,
      creator: fakeCreator,
    };
    expect(allowAccessToCollection(collection, undefined)).toBe(false);
  });

  it("returns false for private collection when discordId does not match creator", () => {
    const collection = {
      visibility: "private" as const,
      creator: fakeCreator,
    };
    expect(allowAccessToCollection(collection, "other-discord")).toBe(
      false
    );
  });

  it("returns false for private collection when creator has no discordId", () => {
    const collection = {
      visibility: "private" as const,
      creator: { ...fakeCreator, discordId: undefined as unknown as string },
    };
    expect(allowAccessToCollection(collection, fakeCreator.discordId)).toBe(false);
  });
});
