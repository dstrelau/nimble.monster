import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  calculateProbabilityDistribution,
  parseDiceNotation,
} from "nimble-dice";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, expect, it, vi } from "vitest";
import { DiceRollerClient } from "./dice-roller-client";

// Model the completed worker response while exercising the real small dice
// distributions and the roller's public rendered output.
vi.mock("@/lib/hooks/useDiceStatistics", () => ({
  useDiceStatistics: (notation: string) => {
    const roll = parseDiceNotation(notation);
    return {
      stats: roll && {
        distribution: calculateProbabilityDistribution(roll),
        averageRoll: 0,
        totalAverageRoll: 0,
        missProbability: 0,
      },
      pending: false,
      showLoading: false,
      error: null,
    };
  },
}));

afterEach(cleanup);

it.each([
  ["1d4+1000000000c", "1000000005"],
  ["1d4n+9007199254740991", "9007199254740992"],
])(
  "renders %s without expanding enormous or unsafe outcome ranges",
  (notation, outcome) => {
    render(
      <NuqsTestingAdapter>
        <DiceRollerClient initialDice={notation} />
      </NuqsTestingAdapter>
    );
    expect(screen.getByText("Outcome gaps omitted.")).toBeInTheDocument();
    expect(screen.getByText(outcome)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reroll" })).toBeEnabled();
  }
);

it.each([
  ["d100", "Invalid dice notation"],
  ["1d20d7", "Disadvantage values over 6 are not supported"],
])("explains why %s is invalid", (notation, message) => {
  render(
    <NuqsTestingAdapter>
      <DiceRollerClient initialDice="1d6" />
    </NuqsTestingAdapter>
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: notation },
  });
  expect(screen.getByText(message, { exact: false })).toBeInTheDocument();
});
