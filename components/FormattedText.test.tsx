import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Condition } from "@/lib/types";
import { FormattedText, PrefixedFormattedText } from "./FormattedText";

afterEach(() => {
  cleanup();
});

const mockConditions: Condition[] = [
  {
    name: "Poisoned",
    description: "Takes poison damage at the start of each turn",
    official: true,
  },
  {
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
