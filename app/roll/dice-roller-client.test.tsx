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

it("combines rare high outcomes into an N+ bar", () => {
  render(
    <NuqsTestingAdapter>
      <DiceRollerClient initialDice="1d20" />
    </NuqsTestingAdapter>
  );
  // Each crit outcome (21-39, 41-59, ...) is under 0.5%, but a natural 20
  // happens 5% of the time, so their total matches the 2-19 bars.
  expect(screen.getByText("21+")).toBeInTheDocument();
  expect(screen.getAllByText("5.0%")).toHaveLength(19);
  expect(screen.queryByText("22")).not.toBeInTheDocument();
});

it("combines rare low outcomes and marks very small chances", () => {
  render(
    <NuqsTestingAdapter>
      <DiceRollerClient initialDice="3d6n" />
    </NuqsTestingAdapter>
  );
  // 3 and 18 each happen 1/216 of the time (0.46%), below the 0.5% cutoff.
  expect(screen.getByText("≤3")).toBeInTheDocument();
  expect(screen.getByText("18+")).toBeInTheDocument();
  expect(screen.getAllByText("0.5%")).toHaveLength(2);

  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "1d12v" },
  });
  // Rare outcomes between common ones keep their real chance: 14 is 0.058%.
  expect(screen.getByText("14")).toBeInTheDocument();
  expect(screen.getByText("<0.1%")).toBeInTheDocument();
});

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

it("keeps the last valid probabilities while editing, then updates on valid input", () => {
  render(
    <NuqsTestingAdapter>
      <DiceRollerClient initialDice="1d4n" />
    </NuqsTestingAdapter>
  );
  const input = screen.getByRole("textbox", { name: "Dice Notation" });
  expect(screen.getAllByText("25.0%")).toHaveLength(4);

  for (const notation of ["", "1", "1d", "1d4+", "1d7"]) {
    fireEvent.change(input, { target: { value: notation } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("25.0%")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "1d4n" })).toBeInTheDocument();
  }

  fireEvent.change(input, { target: { value: "1d8n" } });
  expect(input).toHaveAttribute("aria-invalid", "false");
  expect(screen.queryByText("25.0%")).not.toBeInTheDocument();
  expect(screen.getAllByText("12.5%")).toHaveLength(8);
  expect(screen.getByRole("heading", { name: "1d8n" })).toBeInTheDocument();
});
