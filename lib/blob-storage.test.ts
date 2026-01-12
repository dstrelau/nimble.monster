import { describe, expect, it } from "vitest";
import { generateBlobFilename } from "./blob-storage";

describe("generateBlobFilename", () => {
  it("generates filename for monster", () => {
    const filename = generateBlobFilename("monster", "abc123", "v1");
    expect(filename).toBe("monster-abc123-v1.png");
  });

  it("generates filename for companion", () => {
    const filename = generateBlobFilename("companion", "xyz789", "v2");
    expect(filename).toBe("companion-xyz789-v2.png");
  });

  it("generates filename for item", () => {
    const filename = generateBlobFilename("item", "def456", "v3");
    expect(filename).toBe("item-def456-v3.png");
  });

  it("handles special characters in ids", () => {
    const filename = generateBlobFilename("monster", "id-with-dashes", "v1");
    expect(filename).toBe("monster-id-with-dashes-v1.png");
  });

  it("has consistent format with entity type, id, and version", () => {
    const filename1 = generateBlobFilename("monster", "m1", "v1");
    const filename2 = generateBlobFilename("monster", "m1", "v2");

    expect(filename1).toContain("monster-m1-v1");
    expect(filename2).toContain("monster-m1-v2");
    expect(filename1).not.toBe(filename2);
  });
});
