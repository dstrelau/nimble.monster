import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadConditionUsage,
  updateCondition,
} from "@/app/%5Factions/conditions/contract";
import { deleteCondition } from "@/app/actions/conditions";
import type { ConditionUsage } from "@/lib/conditions";
import { call } from "@/lib/contract";
import { ConditionsLibrary } from "./ConditionsLibrary";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/contract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contract")>()),
  call: vi.fn(),
}));
vi.mock("@/app/actions/conditions", () => ({
  createCondition: vi.fn(),
  deleteCondition: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const unused: ConditionUsage = {
  monsters: 0,
  hazards: 0,
  items: 0,
  spells: 0,
  companions: 0,
  ancestries: 0,
  backgrounds: 0,
  families: 0,
  classes: 0,
  subclasses: 0,
  spellSchools: 0,
  collections: 0,
  encounters: 0,
  tables: 0,
  rules: 0,
  adventures: 0,
};

function renderLibrary(
  usage: ConditionUsage = { ...unused, monsters: 1, rules: 2 }
) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConditionsLibrary
        conditions={[
          {
            id: "condition",
            name: "Dazed",
            description: "Original",
            official: false,
            usage,
          },
        ]}
      />
    </QueryClientProvider>
  );
}

describe("ConditionsLibrary", () => {
  it("edits only the description and discards cancelled edits", async () => {
    renderLibrary();
    expect(
      screen.queryByRole("textbox", { name: "Name" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit Dazed" }));
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Dazed");
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Cancelled text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Dazed" }));
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Original"
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Updated text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(call).toHaveBeenCalledWith(updateCondition, {
      id: "condition",
      description: "Updated text",
    });
  });

  it("searches names and descriptions without case sensitivity", () => {
    renderLibrary();
    const search = screen.getByRole("textbox", { name: "Search conditions" });
    expect(search).toHaveAttribute("placeholder", "Search");
    for (const value of ["DAZ", " original "]) {
      fireEvent.change(search, { target: { value } });
      expect(
        screen.getByRole("heading", { name: "Dazed" })
      ).toBeInTheDocument();
    }
    fireEvent.change(search, { target: { value: "absent" } });
    expect(
      screen.queryByRole("heading", { name: "Dazed" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("No conditions match your search.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Dazed" })).toBeInTheDocument();
  });

  it("shows only positive usage counts", () => {
    renderLibrary();
    expect(
      screen.getByText("Used by 1 monster, 2 custom rules")
    ).toBeInTheDocument();
    expect(screen.queryByText(/0 items/)).not.toBeInTheDocument();
  });

  it("hides usage for unused conditions", () => {
    renderLibrary(unused);
    expect(screen.queryByText(/Used by/)).not.toBeInTheDocument();
  });

  it.each([
    { trigger: "New Condition", initialFocus: "Name" },
    { trigger: "Edit Dazed", initialFocus: "Description" },
  ])("focuses $initialFocus without opening the tooltip for $trigger", async ({
    trigger,
    initialFocus,
  }) => {
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: trigger }));
    expect(screen.getByRole("textbox", { name: initialFocus })).toHaveFocus();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.focus(
      screen.getByRole("button", { name: "About condition names" })
    );
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Names cannot be changed after creation."
    );
  });

  it("requires confirmation with fresh usage and lets the user cancel", async () => {
    vi.mocked(call).mockResolvedValue({
      ...unused,
      monsters: 2,
      items: 3,
      spells: 1,
      rules: 1,
    });
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Delete Dazed" }));
    await screen.findByText(/7 entities in your library reference it/);
    expect(call).toHaveBeenCalledWith(loadConditionUsage, { id: "condition" });
    expect(deleteCondition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Dazed" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Delete Condition" })
      ).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete Condition" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );
    expect(deleteCondition).toHaveBeenCalledWith("condition");
  });

  it.each([
    0, 1,
  ])("only warns about references when the fresh count is positive (%i)", async (count) => {
    vi.mocked(call).mockResolvedValue({ ...unused, adventures: count });
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Delete Dazed" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Delete Condition" })
      ).toBeEnabled()
    );
    expect(
      screen.getByText("Are you sure you want to delete the Dazed condition?")
    ).toBeInTheDocument();
    if (count === 0) {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText(/0 entities/)).not.toBeInTheDocument();
    } else {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "1 entity in your library references it and will no longer display properly."
      );
    }
  });

  it("blocks deletion when usage cannot be loaded", async () => {
    vi.mocked(call).mockRejectedValue(new Error("Unavailable"));
    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Delete Dazed" }));
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Delete Condition" })
    ).toBeDisabled();
    expect(deleteCondition).not.toHaveBeenCalled();
  });
});
