import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./index";
import { createItem } from "./item";

describe("item creation", () => {
  const testDiscordId = `test-discord-id-${Date.now()}`;
  const testUsername = `testuser-${Date.now()}`;

  beforeEach(async () => {
    await prisma.user.create({
      data: {
        discordId: testDiscordId,
        username: testUsername,
        displayName: "Test User",
      },
    });
  });

  afterEach(async () => {
    await prisma.item.deleteMany({
      where: { creator: { discordId: testDiscordId } },
    });
    await prisma.user.deleteMany({
      where: { discordId: testDiscordId },
    });
  });

  it("should save background colors when creating a new item", async () => {
    const itemData = {
      name: "Test Item",
      description: "Test description",
      imageIcon: "sword",
      imageBgIcon: "shield",
      imageColor: "#ff0000",
      imageBgColor: "#00ff00",
      rarity: "common" as const,
      visibility: "public" as const,
      discordId: testDiscordId,
    };

    const createdItem = await createItem(itemData);

    expect(createdItem).toBeDefined();
    expect(createdItem.imageBgColor).toBe("#00ff00");

    const savedItem = await prisma.item.findUnique({
      where: { id: createdItem.id },
    });

    expect(savedItem?.imageBgColor).toBe("#00ff00");
  });
});
