import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DiceNotation } from "./DiceNotation";

afterEach(cleanup);

describe("DiceNotation", () => {
  it.each([
    "1d20-1d4",
    "1d20-2d4+1d6-3",
    "1d20+1d10+3",
  ])("recognizes %s as one clickable roll", (notation) => {
    render(<DiceNotation text={`Roll ${notation} now.`} />);
    const trigger = screen.getByText(notation);
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });
});
