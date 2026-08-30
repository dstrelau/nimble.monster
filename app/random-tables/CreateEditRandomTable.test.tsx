import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type RandomTable, UNKNOWN_USER } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const call = vi.fn();
vi.mock("@/lib/contract", () => ({
  call: (...args: unknown[]) => call(...args),
  defineRoute: (contract: unknown) => contract,
}));

vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));

import { CreateEditRandomTable } from "./CreateEditRandomTable";

const emptyTable: RandomTable = {
  id: "",
  creator: UNKNOWN_USER,
  name: "",
  description: "",
  visibility: "public",
  subtables: [],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateEditRandomTable", () => {
  it("submits a table whose rows carry numeric ranges", async () => {
    call.mockResolvedValue({
      id: "2165faa4-f013-4e5b-a800-0107055dd74f",
      name: "Combat Encounter",
    });

    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Combat Encounter" },
    });
    fireEvent.change(screen.getByPlaceholderText("Encounter Difficulty"), {
      target: { value: "Difficulty" },
    });

    const notation = screen.getByPlaceholderText("2d12");
    fireEvent.change(notation, { target: { value: "" } });
    fireEvent.change(notation, { target: { value: "2d12" } });

    // The seeded row: make it the combined range 3-8.
    const low = screen.getByLabelText("Low roll");
    const high = screen.getByLabelText("High roll");
    fireEvent.change(low, { target: { value: "" } });
    fireEvent.change(low, { target: { value: "3" } });
    fireEvent.change(high, { target: { value: "" } });
    fireEvent.change(high, { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Result"), {
      target: { value: "Easy" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(call).toHaveBeenCalledTimes(1));
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: expect.any(Function),
      }),
      expect.objectContaining({
        id: undefined,
        name: "Combat Encounter",
        visibility: "public",
        subtables: [
          {
            title: "Difficulty",
            notation: "2d12",
            rows: [{ low: 3, high: 8, result: "Easy" }],
          },
        ],
      })
    );
    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("/random-tables/combat-encounter-")
    );
  });

  it("adds rows and tables", async () => {
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    expect(screen.getAllByLabelText("Result")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Add Row/ }));
    expect(screen.getAllByLabelText("Result")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Add Table/ }));
    expect(screen.getAllByPlaceholderText("Encounter Difficulty")).toHaveLength(
      2
    );
  });

  it("blocks submit and shows the error on the row that cannot be rolled", async () => {
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Combat Encounter" },
    });
    fireEvent.change(screen.getByPlaceholderText("Encounter Difficulty"), {
      target: { value: "Difficulty" },
    });

    const notation = screen.getByPlaceholderText("2d12");
    fireEvent.change(notation, { target: { value: "" } });
    fireEvent.change(notation, { target: { value: "2d12" } });

    // 2d12 can never roll a 1.
    const low = screen.getByLabelText("Low roll");
    fireEvent.change(low, { target: { value: "" } });
    fireEvent.change(low, { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Result"), {
      target: { value: "Easy" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("2d12 rolls 2–24")).toBeInTheDocument();
    expect(call).not.toHaveBeenCalled();
  });

  it("shows an error when a roll value is cleared rather than failing silently", async () => {
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Combat Encounter" },
    });
    fireEvent.change(screen.getByPlaceholderText("Encounter Difficulty"), {
      target: { value: "Difficulty" },
    });
    fireEvent.change(screen.getByLabelText("Result"), {
      target: { value: "Easy" },
    });
    fireEvent.change(screen.getByLabelText("Low roll"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Enter a number")).toBeInTheDocument();
    expect(call).not.toHaveBeenCalled();
  });

  it("keeps the draft and shows a JSON route error", async () => {
    call.mockRejectedValue(new Error("Could not save table"));
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Combat Encounter" },
    });
    fireEvent.change(screen.getByPlaceholderText("Encounter Difficulty"), {
      target: { value: "Difficulty" },
    });
    fireEvent.change(screen.getByLabelText("Result"), {
      target: { value: "Easy" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Could not save table")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name")).toHaveValue("Combat Encounter");
    expect(push).not.toHaveBeenCalled();
  });
});
