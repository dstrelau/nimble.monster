import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Condition } from "@/lib/types";
import { FormattedText, PrefixedFormattedText } from "./FormattedText";

// Mock useEntityQuery to avoid QueryClient context issues in tests
// Entity links use createRoot which creates isolated React trees
vi.mock("@/lib/hooks/useEntityQuery", () => ({
  useEntityQuery: () => ({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Test Entity",
      type: "monster",
    },
    isLoading: false,
    isError: false,
  }),
}));

afterEach(() => {
  cleanup();
});

const mockConditions: Condition[] = [
  {
    id: "test-condition-1",
    name: "Poisoned",
    description: "Takes poison damage at the start of each turn",
    official: true,
  },
  {
    id: "test-condition-2",
    name: "Stunned",
    description: "Cannot take actions",
    official: false,
  },
];

describe("FormattedText", () => {
  it("should render both markdown formatting and condition tooltips", () => {
    const content =
      "This is **bold text** and you are [[Poisoned|suffering from poison]].";

    render(<FormattedText content={content} conditions={mockConditions} />);

    // Check for markdown formatting (bold text)
    const boldElement = screen.getByText("bold text");
    expect(boldElement.tagName.toLowerCase()).toBe("strong");

    // Check for condition tooltip text
    const conditionElement = screen.getByText("suffering from poison");
    expect(conditionElement).toHaveClass("underline");
    expect(conditionElement).toHaveClass("decoration-dotted");
  });

  it("should handle plain text without formatting", () => {
    const content = "Just plain text";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("Just plain text")).toBeInTheDocument();
  });

  it("should handle markdown without conditions", () => {
    const content = "This has **bold** and *italic* text";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("bold").tagName.toLowerCase()).toBe("strong");
    expect(screen.getByText("italic").tagName.toLowerCase()).toBe("em");
  });

  it("should handle conditions without markdown", () => {
    const content = "You are [[Poisoned]].";

    render(<FormattedText content={content} conditions={mockConditions} />);

    const conditionElement = screen.getByText("Poisoned");
    expect(conditionElement).toHaveClass("underline");
    expect(conditionElement).toHaveClass("decoration-dotted");
  });

  it("respects newlines", () => {
    const content = "One.\n\n\nTwo.";

    const { container } = render(
      <FormattedText content={content} conditions={mockConditions} />
    );

    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent("One.");
    expect(paragraphs[1]).toHaveTextContent("Two.");
  });

  it("should handle unknown conditions", () => {
    const content = "You are [[Blinded]].";

    render(<FormattedText content={content} conditions={mockConditions} />);

    const conditionElement = screen.getByText("Blinded");
    expect(conditionElement).toHaveClass("underline");
    expect(conditionElement).toHaveClass("decoration-dotted");
    expect(conditionElement).toHaveClass("cursor-help");
  });

  it("should handle conditions without display text", () => {
    const content = "You are [[Poisoned]].";

    render(<FormattedText content={content} conditions={mockConditions} />);

    const conditionElement = screen.getByText("Poisoned");
    expect(conditionElement).toHaveClass("underline");
    expect(conditionElement).toHaveClass("decoration-dotted");
  });

  it("should handle multiple conditions in one text", () => {
    const content = "You are [[Poisoned|suffering]] and [[Stunned]].";

    render(<FormattedText content={content} conditions={mockConditions} />);

    const poisonedElement = screen.getByText("suffering");
    expect(poisonedElement).toHaveClass("underline");
    expect(poisonedElement).toHaveClass("decoration-dotted");

    const stunnedElement = screen.getByText("Stunned");
    expect(stunnedElement).toHaveClass("underline");
    expect(stunnedElement).toHaveClass("decoration-dotted");
  });

  it("should handle complex markdown with conditions", () => {
    const content =
      "**Bold** text with [[Poisoned|poison]] and *italic* with [[Stunned]].";

    render(<FormattedText content={content} conditions={mockConditions} />);

    expect(screen.getByText("Bold").tagName.toLowerCase()).toBe("strong");
    expect(screen.getByText("italic").tagName.toLowerCase()).toBe("em");

    const poisonElement = screen.getByText("poison");
    expect(poisonElement).toHaveClass("underline");
    expect(poisonElement).toHaveClass("decoration-dotted");

    const stunnedElement = screen.getByText("Stunned");
    expect(stunnedElement).toHaveClass("underline");
    expect(stunnedElement).toHaveClass("decoration-dotted");
  });

  it("should handle list formatting", () => {
    const content = "Effects:\n- [[Poisoned]]\n- **Heavy damage**";

    const { container } = render(
      <FormattedText content={content} conditions={mockConditions} />
    );

    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(2);

    const poisonedElement = screen.getByText("Poisoned");
    expect(poisonedElement).toHaveClass("underline");
    expect(poisonedElement).toHaveClass("decoration-dotted");

    const boldElement = screen.getByText("Heavy damage");
    expect(boldElement.tagName.toLowerCase()).toBe("strong");
  });

  it("should handle edge cases and malformed syntax", () => {
    const content =
      "[[InvalidCondition]] incomplete [ syntax and [[Poisoned]] normal";

    const { container } = render(
      <FormattedText content={content} conditions={mockConditions} />
    );

    const poisonedElement = screen.getByText("Poisoned");
    expect(poisonedElement).toHaveClass("underline");
    expect(poisonedElement).toHaveClass("decoration-dotted");
    expect(container).toHaveTextContent("normal");
    expect(screen.getByText("InvalidCondition")).toHaveClass("cursor-help");
    expect(container).toHaveTextContent("incomplete [ syntax and");
  });

  it("should handle empty content", () => {
    const { container } = render(
      <FormattedText content="" conditions={mockConditions} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("FormattedText - Dice Notation", () => {
  it("should parse basic dice notation", () => {
    const content = "Deal 1d6 damage.";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("1d6")).toBeInTheDocument();
  });

  it("should parse dice notation with modifiers", () => {
    const content = "Attack for 2d8+3 damage.";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("2d8+3")).toBeInTheDocument();
  });

  it("should parse dice notation with negative modifiers", () => {
    const content = "Lose 1d4-2 HP.";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("1d4-2")).toBeInTheDocument();
  });

  it("should parse dice with advantage/disadvantage/vicious", () => {
    const content =
      "Roll 3d6a with advantage or 2d8d with disadvantage or 4d10v vicious.";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    expect(container).toHaveTextContent("3d6 ADV");
    expect(container).toHaveTextContent("2d8 DIS");
    expect(container).toHaveTextContent("4d10 (Vicious)");
  });

  it("should parse multiple dice notations in one text", () => {
    const content = "Attack 1d6 and defend with 2d8+2.";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("1d6")).toBeInTheDocument();
    expect(screen.getByText("2d8+2")).toBeInTheDocument();
  });

  it("should handle dice notation with markdown", () => {
    const content = "**Critical hit** for 4d6+6 damage!";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("Critical hit").tagName.toLowerCase()).toBe(
      "strong"
    );
    expect(screen.getByText("4d6+6")).toBeInTheDocument();
  });

  it("should handle dice notation with conditions", () => {
    const content = "Deal 2d6 damage and [[Poisoned|poison]] the target.";

    render(<FormattedText content={content} conditions={mockConditions} />);

    expect(screen.getByText("2d6")).toBeInTheDocument();
    const poisonElement = screen.getByText("poison");
    expect(poisonElement).toHaveClass("underline");
  });

  it("should handle dice notation in lists", () => {
    const content = "Attacks:\n- Smash: 4d6+6\n- Bite: 2d4+2";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(2);
    expect(screen.getByText("4d6+6")).toBeInTheDocument();
    expect(screen.getByText("2d4+2")).toBeInTheDocument();
  });

  it("should not parse incomplete dice notation", () => {
    const { container } = render(
      <FormattedText
        content="This has d6 without a number and 1d without die size."
        conditions={[]}
      />
    );

    expect(container).toHaveTextContent(
      "This has d6 without a number and 1d without die size."
    );
    expect(
      container.querySelector('[class*="cursor-pointer"]')
    ).not.toBeInTheDocument();
  });

  it("should handle dice in parentheses and complex markdown", () => {
    const content = "Deal damage (1d6) **or** heal (2d8+3).";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("1d6")).toBeInTheDocument();
    expect(screen.getByText("2d8+3")).toBeInTheDocument();
    expect(screen.getByText("or").tagName.toLowerCase()).toBe("strong");
  });
});

describe("FormattedText - Entity Links", () => {
  it.skip("should parse basic entity link syntax", () => {
    // TODO: Fix test - entity links require client-side context (useIsClient, QueryClient)
    const content = "Check out this @monster:abc123xyz creature.";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    const entityPlaceholder = container.querySelector(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholder).toBeInTheDocument();
  });

  it.skip("should parse multiple entity types", () => {
    // TODO: Fix test - entity links require client-side context
    const content =
      "Use @item:def456 with @monster:abc123 to fight @companion:ghi789.";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    const entityPlaceholders = container.querySelectorAll(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholders).toHaveLength(3);
  });

  it.skip("should handle entity links with markdown", () => {
    // TODO: Fix test - entity links require client-side context
    const content = "**Important**: See @monster:abc123xyz for details.";

    render(<FormattedText content={content} conditions={[]} />);

    expect(screen.getByText("Important").tagName.toLowerCase()).toBe("strong");
  });

  it.skip("should handle entity links with conditions", () => {
    // TODO: Fix test - entity links require client-side context
    const content = "The @monster:abc123 inflicts [[Poisoned|poison]] on hit.";

    const { container } = render(
      <FormattedText content={content} conditions={mockConditions} />
    );

    const poisonElement = screen.getByText("poison");
    expect(poisonElement).toHaveClass("underline");

    const entityPlaceholder = container.querySelector(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholder).toBeInTheDocument();
  });

  it.skip("should handle entity links with dice notation", () => {
    // TODO: Fix test - entity links require client-side context
    const content = "The @monster:abc123 deals 2d6+3 damage.";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    expect(screen.getByText("2d6+3")).toBeInTheDocument();
    const entityPlaceholder = container.querySelector(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholder).toBeInTheDocument();
  });

  it("should not parse invalid entity types", () => {
    const content = "This @invalidtype:abc123 should not parse.";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    // Should render as plain text
    expect(container).toHaveTextContent("This @invalidtype:abc123");
    const entityPlaceholder = container.querySelector(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholder).not.toBeInTheDocument();
  });

  it("should not parse incomplete entity syntax", () => {
    const content = "Incomplete @monster or @:abc123 syntax.";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    expect(container).toHaveTextContent("Incomplete @monster or @:abc123");
    const entityPlaceholder = container.querySelector(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholder).not.toBeInTheDocument();
  });

  it.skip("should handle all entity types", () => {
    // TODO: Fix test - entity links require client-side context
    const content =
      "@monster:a1 @item:b2 @companion:c3 @family:d4 @collection:e5 @school:f6 @subclass:g7 @ancestry:h8 @background:i9";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    const entityPlaceholders = container.querySelectorAll(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholders).toHaveLength(9);
  });

  it.skip("should handle entity links in lists", () => {
    // TODO: Fix test - entity links require client-side context
    const content = "Enemies:\n- @monster:abc123\n- @monster:def456";

    const { container } = render(
      <FormattedText content={content} conditions={[]} />
    );

    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(2);

    const entityPlaceholders = container.querySelectorAll(
      '[id^="entity-placeholder-"]'
    );
    expect(entityPlaceholders).toHaveLength(2);
  });
});

describe("PrefixedFormattedText", () => {
  it("should render prefix and formatted content", () => {
    const prefix = <span className="prefix-class">Prefix:</span>;
    const content = "This is **bold** text with [[Poisoned]].";

    render(
      <PrefixedFormattedText
        prefix={prefix}
        content={content}
        conditions={mockConditions}
      />
    );

    expect(screen.getByText("Prefix:")).toHaveClass("prefix-class");
    expect(screen.getByText("bold").tagName.toLowerCase()).toBe("strong");
    expect(screen.getByText("Poisoned")).toHaveClass("underline");
    expect(screen.getByText("Poisoned")).toHaveClass("decoration-dotted");
  });
});
