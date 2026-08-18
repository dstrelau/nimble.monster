import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/lib/services/items";
import type { User } from "@/lib/types";
import { Card } from "./Card";

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => null,
}));

vi.mock("@/components/shared/CardFooterLayout", () => ({
  CardFooterLayout: () => null,
}));

afterEach(() => {
  cleanup();
});

const creator: User = {
  id: "creator",
  discordId: "",
  username: "creator",
  displayName: "Creator",
};

describe("Item Card", () => {
  it("preserves paragraph breaks in the description", () => {
    const item: Item = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Instruction Manual",
      description: "First paragraph.\n\nSecond paragraph.",
      rarity: "common",
      visibility: "public",
      creator,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const { container } = render(
      <Card item={item} creator={creator} link={false} hideActions />
    );

    const formattedText = container.querySelector(".formatted-text");
    const paragraphs = formattedText?.querySelectorAll("p");

    expect(formattedText).not.toHaveClass("formatted-text--inline");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs?.[0]).toHaveTextContent("First paragraph.");
    expect(paragraphs?.[1]).toHaveTextContent("Second paragraph.");
  });
});
