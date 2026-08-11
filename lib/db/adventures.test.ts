import { describe, expect, it } from "vitest";
import type { AdventureInput, AdventureNodeInput } from "./adventures";
import { createAdventure } from "./adventures";

function node(
  id: string,
  kind: AdventureNodeInput["kind"],
  parentId: string | null
): AdventureNodeInput {
  return {
    id,
    parentId,
    kind,
    orderIndex: 0,
    title: kind === "section" ? id : "",
    content: "",
    encounterId: null,
    monsterIds: [],
    itemIds: [],
    missingStatblockCount: 0,
    presentation: null,
  };
}

function adventure(nodes: AdventureNodeInput[]): AdventureInput {
  return {
    name: "Test Adventure",
    tagline: "",
    summary: "",
    visibility: "private",
    nodes,
  };
}

describe("adventure nesting validation", () => {
  it("allows only sections to contain child content", async () => {
    await expect(
      createAdventure(
        "user-1",
        adventure([
          node("text", "text", null),
          node("child", "section", "text"),
        ])
      )
    ).rejects.toThrow("Only sections may contain child content");
  });

  it("rejects content nested more than two levels", async () => {
    await expect(
      createAdventure(
        "user-1",
        adventure([
          node("root", "section", null),
          node("child", "section", "root"),
          node("grandchild", "section", "child"),
          node("too-deep", "section", "grandchild"),
        ])
      )
    ).rejects.toThrow("Adventure content may be nested only two levels");
  });

  it("rejects using the same image in multiple sections", async () => {
    const imageId = "11111111-1111-4111-8111-111111111111";
    const firstImage: AdventureNodeInput = {
      ...node("first-image", "image", null),
      imageId,
      imageExtension: "png",
    };
    const secondImage: AdventureNodeInput = {
      ...node("second-image", "image", null),
      imageId,
      imageExtension: "png",
    };

    await expect(
      createAdventure("user-1", adventure([firstImage, secondImage]))
    ).rejects.toThrow("Each adventure image may be used only once");
  });

  it.each([
    -1,
    0.5,
    Number.NaN,
    11,
  ])("rejects an invalid missing statblock count of %s", async (missingStatblockCount) => {
    await expect(
      createAdventure(
        "user-1",
        adventure([
          {
            ...node("monsters", "monsters", null),
            missingStatblockCount,
          },
        ])
      )
    ).rejects.toThrow(
      "Missing statblock count must be an integer from 0 to 10"
    );
  });

  it("rejects more than ten live and missing statblock references", async () => {
    await expect(
      createAdventure(
        "user-1",
        adventure([
          {
            ...node("monsters", "monsters", null),
            monsterIds: Array.from(
              { length: 10 },
              (_, index) => `monster-${index}`
            ),
            missingStatblockCount: 1,
          },
        ])
      )
    ).rejects.toThrow("Statblock groups may contain at most 10 references");
  });
});
