import { describe, expect, it } from "vitest";
import { allowAccessToCollection } from "./repository";

const fakeCreator = {
  id: "12345678-1234-1234-1234-1234567890ab",
  discordId: "user123",
  username: "testuser",
  displayName: "Test User",
};

describe("allowAccessToCollection", () => {
  it("returns true for public collection regardless of discordId", async () => {
    const collection = {
      visibility: "public" as const,
      creator: fakeCreator,
    };
    expect(await allowAccessToCollection(collection, undefined)).toBe(true);
    expect(await allowAccessToCollection(collection, fakeCreator.discordId)).toBe(true);
    expect(await allowAccessToCollection(collection, "other")).toBe(true);
  });

  it("returns true for private collection when discordId matches creator", async () => {
    const collection = {
      visibility: "private" as const,
      creator: fakeCreator,
    };
    expect(await allowAccessToCollection(collection, fakeCreator.discordId)).toBe(true);
  });

  it("returns false for private collection when discordId is undefined", async () => {
    const collection = {
      visibility: "private" as const,
      creator: fakeCreator,
    };
    expect(await allowAccessToCollection(collection, undefined)).toBe(false);
  });

  it("returns false for private collection when discordId does not match creator", async () => {
    const collection = {
      visibility: "private" as const,
      creator: fakeCreator,
    };
    expect(await allowAccessToCollection(collection, "other-discord")).toBe(
      false
    );
  });

  it("returns false for private collection when creator has no discordId", async () => {
    const collection = {
      visibility: "private" as const,
      creator: { ...fakeCreator, discordId: undefined as unknown as string },
    };
    expect(await allowAccessToCollection(collection, fakeCreator.discordId)).toBe(false);
  });
});
