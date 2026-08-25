import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/lib/services/items";
import type { User } from "@/lib/types";
import { Card } from "./Card";

const cardFooterLayoutMock = vi.hoisted(() => vi.fn((_props: unknown) => null));

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => null,
}));

vi.mock("@/components/shared/CardFooterLayout", () => ({
  CardFooterLayout: cardFooterLayoutMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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

  it("preserves the regular image proportions and rarity details when compact", () => {
    const item: Item = {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Legendary Relic",
      description: "Description",
      rarity: "legendary",
      visibility: "public",
      imageIcon: "game-icons:relic-blade",
      creator,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const { container } = render(
      <Card item={item} creator={creator} link={false} hideActions compact />
    );

    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveAttribute("data-rarity", "legendary");
    expect(container.querySelector(".max-w-56")).toBeInTheDocument();
    expect(container.querySelector('[class~="h-1/2"]')).toBeInTheDocument();
    expect(container.querySelector('[class~="w-1/2"]')).toBeInTheDocument();
    expect(cardFooterLayoutMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ attributionSize: "print" })
    );
  });
});
