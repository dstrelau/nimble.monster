import { describe, expect, it } from "vitest";
import { generateBlobFilename, generateEntityImagePath } from "./blob-storage";

describe("generateBlobFilename", () => {
  it("light theme omits theme segment (backwards compat)", () => {
    const filename = generateBlobFilename("monster", "abc123", "light", "v1");
    expect(filename).toBe("monster-abc123-v1.png");
  });

  it("dark theme includes theme segment", () => {
    const filename = generateBlobFilename("companion", "xyz789", "dark", "v2");
    expect(filename).toBe("companion-xyz789-dark-v2.png");
  });

  it("handles special characters in ids", () => {
    const filename = generateBlobFilename(
      "monster",
      "id-with-dashes",
      "light",
      "v1"
    );
    expect(filename).toBe("monster-id-with-dashes-v1.png");
  });

  it("varies by theme and version", () => {
    const filename1 = generateBlobFilename("monster", "m1", "light", "v1");
    const filename2 = generateBlobFilename("monster", "m1", "dark", "v1");
    const filename3 = generateBlobFilename("monster", "m1", "light", "v2");

    expect(filename1).not.toBe(filename2);
    expect(filename1).not.toBe(filename3);
  });
});

describe("generateEntityImagePath", () => {
  it("light theme uses legacy path format", () => {
    const path = generateEntityImagePath("monster", "abc123", "light", "v1");
    expect(path).toBe("card-images/monster/monster-abc123-v1.png");
  });

  it("dark theme includes theme in path", () => {
    const path = generateEntityImagePath("companion", "xyz789", "dark", "v2");
    expect(path).toBe("card-images/companion/companion-xyz789-dark-v2.png");
  });
});
