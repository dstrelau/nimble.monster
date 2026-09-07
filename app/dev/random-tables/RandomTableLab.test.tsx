import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RandomTableLab } from "./RandomTableLab";

afterEach(cleanup);

describe("RandomTableLab", () => {
  it("toggles between editing and the rendered preview", () => {
    render(<RandomTableLab />);

    expect(
      screen.queryByRole("radio", { name: "Dice table" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle preview" })
    ).not.toBePressed();
    expect(
      screen.getByRole("button", { name: "Add column" })
    ).toHaveTextContent("Add column");

    fireEvent.change(screen.getByRole("textbox", { name: "Table title" }), {
      target: { value: "Armory 1d20" },
    });
    fireEvent.change(screen.getByLabelText("Weapon, row 1"), {
      target: { value: "Silver dagger" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle preview" }));

    expect(
      screen.getByRole("button", { name: "Toggle preview" })
    ).toBePressed();
    expect(
      screen.queryByRole("textbox", { name: "Table title" })
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Silver dagger")).toHaveLength(2);
    expect(screen.getAllByText("1d20").length).toBeGreaterThan(0);
  });

  it("models a dice table using ordinary columns", () => {
    render(<RandomTableLab />);

    fireEvent.click(screen.getByRole("radio", { name: "Road encounters" }));

    expect(
      screen.getByDisplayValue("Road Encounters — 1d6")
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Column name")).toHaveLength(3);
    expect(screen.getByDisplayValue("Roll")).toBeInTheDocument();
    expect(screen.getByLabelText("Roll, row 2")).toHaveValue("2–3");
  });

  it("removes a row directly from its trash button", () => {
    render(<RandomTableLab />);

    expect(screen.getByLabelText("Weapon, row 2")).toHaveValue("Shortsword");
    fireEvent.click(screen.getByRole("button", { name: "Remove row 2" }));

    expect(screen.queryByDisplayValue("Shortsword")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Remove row/ })).toHaveLength(
      2
    );
  });

  it("separates stacked rows without boxing them", () => {
    render(<RandomTableLab />);

    const separators = screen.getAllByRole("separator");
    expect(separators).toHaveLength(2);
    expect(
      separators.every((separator) => separator.classList.contains("w-3/5"))
    ).toBe(true);
  });

  it("renders dice notation and inline formatting in previews", async () => {
    render(<RandomTableLab />);

    fireEvent.change(screen.getByLabelText("Weapon, row 1"), {
      target: { value: "A **silver** *dagger*" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle preview" }));

    expect(
      screen.getAllByText("silver").every((node) => node.tagName === "STRONG")
    ).toBe(true);
    expect(
      screen.getAllByText("dagger").every((node) => node.tagName === "EM")
    ).toBe(true);
    expect((await screen.findAllByText("1d4")).length).toBeGreaterThan(0);
  });
});
