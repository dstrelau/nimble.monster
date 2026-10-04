import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RandomTableSchema } from "@/lib/random-table-schema";
import { STRESS_TEST_TABLE } from "./fixtures";

const push = vi.fn();
const call = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/contract", () => ({
  call: (...args: unknown[]) => call(...args),
  defineRoute: (contract: unknown) => contract,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/shared/FormattedText", () => ({
  FormattedText: ({ content }: { content: string }) => <span>{content}</span>,
}));

import { RandomTableLab } from "./RandomTableLab";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RandomTableLab", () => {
  it("loads five valid stress fixtures with wide and narrow tables", () => {
    expect(RandomTableSchema.safeParse(STRESS_TEST_TABLE).success).toBe(true);
    render(<RandomTableLab />);
    expect(screen.getAllByRole("table")).toHaveLength(5);
    expect(screen.getAllByLabelText("Column name")).toHaveLength(29);
    expect(screen.getByLabelText("1d100, row 1")).toHaveValue("01–20");
    expect(screen.getByLabelText("Damage, row 1")).toHaveValue("1d4");
  });

  it("previews edits without saving or navigating and keeps them when returning", async () => {
    render(<RandomTableLab />);
    fireEvent.change(screen.getByLabelText("Weapon, row 1"), {
      target: { value: "Silver dagger" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText("Silver dagger")).toBeInTheDocument();
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(5);
    expect(tables[0].parentElement?.parentElement).toHaveClass("md:col-span-2");
    expect(tables[3].parentElement?.parentElement).not.toHaveClass(
      "md:col-span-2"
    );
    expect(within(tables[1]).getByText(/Goblin Minion/)).toBeInTheDocument();
    expect(call).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Edit tables" }));
    expect(screen.getByLabelText("Weapon, row 1")).toHaveValue("Silver dagger");
    fireEvent.click(screen.getByRole("button", { name: "Reset example" }));
    expect(screen.getByLabelText("Weapon, row 1")).toHaveValue("Dagger");
  });

  it("uses production column and row controls and resets structural changes", () => {
    render(<RandomTableLab />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add column" })[0]);
    expect(screen.getAllByLabelText("Column name")).toHaveLength(30);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove row 2" })[0]);
    expect(screen.queryByDisplayValue("Longbow")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset example" }));
    expect(screen.getAllByLabelText("Column name")).toHaveLength(29);
    expect(screen.getByDisplayValue("Longbow")).toBeInTheDocument();
  });
});
