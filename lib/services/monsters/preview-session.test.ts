import { rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deletePreviewSession,
  readPreviewSession,
  writePreviewSession,
} from "./preview-session";

const LOCAL_DIR = join(process.cwd(), "tmp", "preview-sessions");

describe("preview-session", () => {
  const sessionKey = "test-session-key";

  beforeEach(async () => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    try {
      await rm(join(LOCAL_DIR, `${sessionKey}.json`));
    } catch {
      // Ignore if file doesn't exist
    }
  });

  it("writes and reads session data", async () => {
    const testData = {
      monsters: [
        {
          type: "monsters" as const,
          id: "test-id",
          attributes: {
            name: "Test Monster",
            hp: 10,
            level: 1,
            size: "medium",
            armor: "none",
            kind: "Test Kind",
            movement: [{ speed: 6 }],
            abilities: [],
            actions: [],
            actionsInstructions: "",
            description: "",
            legendary: false,
          },
        },
      ],
      families: new Map([
        [
          "test-family",
          {
            type: "families" as const,
            id: "test-family",
            attributes: {
              name: "Test Family",
              abilities: [],
            },
          },
        ],
      ]),
      source: {
        name: "Test Source",
        abbreviation: "TS",
        license: "Test License",
        link: "https://example.com",
      },
    };

    await writePreviewSession(sessionKey, testData);
    const result = await readPreviewSession(sessionKey);

    expect(result).not.toBeNull();
    expect(result?.monsters).toHaveLength(1);
    expect(result?.monsters[0].attributes.name).toBe("Test Monster");
    expect(result?.families).toHaveLength(1);
    expect(result?.families[0][0]).toBe("test-family");
    expect(result?.source?.name).toBe("Test Source");
  });

  it("returns null for non-existent session", async () => {
    const result = await readPreviewSession("non-existent-session");
    expect(result).toBeNull();
  });

  it("returns null for expired session", async () => {
    const testData = {
      monsters: [],
      families: new Map(),
    };

    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    await writePreviewSession(sessionKey, testData);

    vi.setSystemTime(new Date("2025-01-01T00:16:00Z"));
    const result = await readPreviewSession(sessionKey);

    expect(result).toBeNull();
  });

  it("deletes session", async () => {
    const testData = {
      monsters: [],
      families: new Map(),
    };

    await writePreviewSession(sessionKey, testData);
    await deletePreviewSession(sessionKey);
    const result = await readPreviewSession(sessionKey);

    expect(result).toBeNull();
  });

  it("handles delete of non-existent session gracefully", async () => {
    await expect(
      deletePreviewSession("non-existent-session")
    ).resolves.not.toThrow();
  });
});
