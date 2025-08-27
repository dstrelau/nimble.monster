import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Condition } from "@/lib/types";
import { FormattedText } from "./FormattedText";

const mockConditions: Condition[] = [
  {
    name: "Poisoned",
    description: "Takes poison damage at the start of each turn",
    official: true,
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
    expect(conditionElement).toHaveClass("text-primary-success");
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
    expect(conditionElement).toHaveClass("text-primary-success");
  });
});
