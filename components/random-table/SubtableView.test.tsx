import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/shared/FormattedText", () => ({
  FormattedText: ({ content }: { content: string }) => <span>{content}</span>,
}));

import { SubtableView } from "./SubtableView";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const subtable = {
  title: "Weapons",
  columns: [
    { id: "roll", name: "1d6" },
    { id: "weapon", name: "Weapon" },
    { id: "price", name: "Price" },
    { id: "damage", name: "Damage" },
  ],
  rows: [
    {
      cells: {
        roll: "1",
        weapon: "Dagger",
        price: "5 gp",
        damage: "1d4",
      },
    },
    {
      cells: {
        roll: "2–3",
        weapon: "Shortsword",
        price: "10 gp",
        damage: "1d6",
      },
    },
  ],
};

describe("SubtableView", () => {
  it("renders the table title and each custom column header", () => {
    render(<SubtableView subtable={subtable} conditions={[]} />);

    expect(screen.getByText("Weapons")).toBeInTheDocument();
    expect(screen.getByText("Weapons").closest("table")).toBeNull();
    for (const name of ["1d6", "Weapon", "Price", "Damage"]) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
  });

  it("renders cell values under the custom columns", () => {
    render(<SubtableView subtable={subtable} conditions={[]} />);

    for (const value of [
      "1",
      "Dagger",
      "5 gp",
      "1d4",
      "2–3",
      "Shortsword",
      "10 gp",
    ]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByRole("cell", { name: "1d6" })).toBeInTheDocument();
  });

  it("shows an em dash for an empty cell", () => {
    render(
      <SubtableView
        subtable={{
          ...subtable,
          rows: [{ cells: { roll: "1", weapon: "", price: "", damage: "" } }],
        }}
        conditions={[]}
      />
    );

    expect(screen.getAllByText("—")).toHaveLength(3);
  });
});
