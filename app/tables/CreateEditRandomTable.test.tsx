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

const weaponsTable: RandomTable = {
  ...emptyTable,
  id: "2165faa4-f013-4e5b-a800-0107055dd74f",
  name: "Weapons",
  subtables: [
    {
      id: "56648cf2-a838-40dc-a66a-2712ea10c5a7",
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
      ],
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateEditRandomTable", () => {
  it("submits arbitrary columns and their keyed cell values", async () => {
    call.mockResolvedValue({ id: weaponsTable.id, name: weaponsTable.name });
    render(<CreateEditRandomTable randomTable={weaponsTable} />);

    fireEvent.change(screen.getByLabelText("Price, row 1"), {
      target: { value: "6 gp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(call).toHaveBeenCalledTimes(1));
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        path: expect.any(Function),
      }),
      expect.objectContaining({
        id: weaponsTable.id,
        name: "Weapons",
        subtables: [
          {
            id: weaponsTable.subtables[0].id,
            title: "Weapons",
            columns: weaponsTable.subtables[0].columns,
            rows: [
              {
                cells: {
                  roll: "1",
                  weapon: "Dagger",
                  price: "6 gp",
                  damage: "1d4",
                },
              },
            ],
          },
        ],
      })
    );
  });

  it("retains the surviving database ID after removal and leaves a new table ID unassigned", async () => {
    call.mockResolvedValue({ id: weaponsTable.id, name: weaponsTable.name });
    render(
      <CreateEditRandomTable
        randomTable={{
          ...weaponsTable,
          subtables: [
            {
              ...weaponsTable.subtables[0],
              id: "783bf563-70c8-4342-94f5-7b1b5d709766",
              title: "Remove me",
            },
            weaponsTable.subtables[0],
          ],
        }}
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Remove table" })[0]);
    fireEvent.change(screen.getByLabelText("Table title"), {
      target: { value: "Renamed weapons" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Table" }));
    fireEvent.change(screen.getAllByLabelText("Table title")[1], {
      target: { value: "New table" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(call).toHaveBeenCalledTimes(1));
    expect(call.mock.calls[0][1].subtables).toEqual([
      expect.objectContaining({
        id: weaponsTable.subtables[0].id,
        title: "Renamed weapons",
      }),
      {
        title: "New table",
        columns: [
          { id: "roll", name: "1d6" },
          { id: "result", name: "Result" },
        ],
        rows: [{ cells: { roll: "", result: "" } }],
      },
    ]);
    expect(call.mock.calls[0][1].subtables[0]).not.toHaveProperty("fieldKey");
  });

  it("adds and removes columns while keeping row cells aligned", () => {
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    expect(screen.getAllByLabelText("Column name")).toHaveLength(2);
    expect(screen.getAllByLabelText(/row 1$/)).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Add column" }));
    expect(screen.getAllByLabelText("Column name")).toHaveLength(3);
    expect(screen.getAllByLabelText(/row 1$/)).toHaveLength(3);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Column 3 column" })
    );
    expect(screen.getAllByLabelText("Column name")).toHaveLength(2);
    expect(screen.getAllByLabelText(/row 1$/)).toHaveLength(2);
  });

  it("keeps table actions fixed and gives wide tables the full grid width", () => {
    render(<CreateEditRandomTable randomTable={weaponsTable} />);

    const card = screen
      .getByLabelText("Table title")
      .closest(".overflow-hidden");
    const addColumn = screen.getByRole("button", { name: "Add column" });

    expect(card).not.toHaveClass("md:col-span-2");
    expect(addColumn.closest("table")).toBeNull();

    fireEvent.click(addColumn);

    expect(card).toHaveClass("md:col-span-2");
  });

  it("adds rows and tables", () => {
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.click(screen.getByRole("button", { name: "Add Row" }));
    expect(screen.getAllByRole("textbox", { name: /row 2$/ })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Add Table" }));
    expect(screen.getAllByLabelText("Table title")).toHaveLength(2);
  });

  it("blocks submit when a column name is empty", async () => {
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Weather" },
    });
    fireEvent.change(screen.getByLabelText("Table title"), {
      target: { value: "Weather" },
    });
    fireEvent.change(screen.getAllByLabelText("Column name")[0], {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Column name is required")
    ).toBeInTheDocument();
    expect(call).not.toHaveBeenCalled();
  });

  it("keeps the draft and shows a route error", async () => {
    call.mockRejectedValue(new Error("Could not save table"));
    render(<CreateEditRandomTable randomTable={emptyTable} isCreating />);

    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Weather" },
    });
    fireEvent.change(screen.getByLabelText("Table title"), {
      target: { value: "Weather" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Could not save table")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name")).toHaveValue("Weather");
    expect(push).not.toHaveBeenCalled();
  });
});
