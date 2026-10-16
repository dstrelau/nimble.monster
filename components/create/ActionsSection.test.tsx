import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionsSection } from "@/components/create/ActionsSection";
import type { Action } from "@/lib/types";

// Only mock what causes the next-auth import issue
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => <div>validation-icon</div>,
}));

afterEach(() => {
  cleanup();
});

describe("ActionsSection", () => {
  const mockOnChange = vi.fn();
  const mockOnPrefaceChange = vi.fn();

  it("maintains focus when typing in action name", () => {
    const actions: Action[] = [
      { id: "test-id-1", name: "", damage: "", description: "" },
    ];
    render(
      <ActionsSection
        actions={actions}
        actionPreface=""
        onChange={mockOnChange}
        onPrefaceChange={mockOnPrefaceChange}
      />
    );

    const nameInput = screen.getByLabelText("Name");
    nameInput.focus();

    fireEvent.change(nameInput, { target: { value: "Fireball" } });

    expect(document.activeElement).toBe(nameInput);
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-id-1", name: "Fireball", damage: "", description: "" },
    ]);
  });

  it("maintains focus when typing in action description", () => {
    const actions: Action[] = [
      { id: "test-id-2", name: "Fireball", damage: "1d6", description: "" },
    ];
    render(
      <ActionsSection
        actions={actions}
        actionPreface=""
        onChange={mockOnChange}
        onPrefaceChange={mockOnPrefaceChange}
      />
    );

    const descInput = screen.getByRole("textbox", { name: /description/i });
    descInput.focus();

    fireEvent.change(descInput, { target: { value: "Deals fire damage" } });

    expect(document.activeElement).toBe(descInput);
    expect(mockOnChange).toHaveBeenCalledWith([
      {
        id: "test-id-2",
        name: "Fireball",
        damage: "1d6",
        description: "Deals fire damage",
      },
    ]);
  });

  it("adds new action when add button is clicked", () => {
    const actions: Action[] = [
      { id: "test-id-3", name: "Existing", damage: "1d4", description: "Test" },
    ];
    render(
      <ActionsSection
        actions={actions}
        actionPreface=""
        onChange={mockOnChange}
        onPrefaceChange={mockOnPrefaceChange}
      />
    );

    const addButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-id-3", name: "Existing", damage: "1d4", description: "Test" },
      expect.objectContaining({ name: "", damage: "", description: "" }),
    ]);
  });

  it("removes action when remove button is clicked", () => {
    const actions: Action[] = [
      {
        id: "test-id-4",
        name: "First",
        damage: "1d4",
        description: "First desc",
      },
      {
        id: "test-id-5",
        name: "Second",
        damage: "1d6",
        description: "Second desc",
      },
    ];
    render(
      <ActionsSection
        actions={actions}
        actionPreface=""
        onChange={mockOnChange}
        onPrefaceChange={mockOnPrefaceChange}
      />
    );

    const removeButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector('svg[class*="trash"]'));
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([
      {
        id: "test-id-5",
        name: "Second",
        damage: "1d6",
        description: "Second desc",
      },
    ]);
  });

  it("updates action preface", () => {
    const actions: Action[] = [];
    render(
      <ActionsSection
        actions={actions}
        actionPreface=""
        onChange={mockOnChange}
        onPrefaceChange={mockOnPrefaceChange}
      />
    );

    const prefaceInput = screen.getByLabelText("Preface");
    fireEvent.change(prefaceInput, {
      target: { value: "The monster can make the following attacks:" },
    });

    expect(mockOnPrefaceChange).toHaveBeenCalledWith(
      "The monster can make the following attacks:"
    );
  });

  it("renders empty state with add button and preface field", () => {
    render(
      <ActionsSection
        actions={[]}
        actionPreface=""
        onChange={mockOnChange}
        onPrefaceChange={mockOnPrefaceChange}
      />
    );

    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByLabelText("Preface")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("applies structured details without submitting, cancels edits, and clears optional counts", () => {
    function Editor() {
      const [actions, setActions] = useState<Action[]>([
        {
          id: "stab",
          name: "Stab",
          description: "Push 1 space.",
          range: "within sight",
          target: { reach: 2 },
          attackCount: 3,
          alternative: { name: "Shoot", target: { range: 9 } },
        },
      ]);
      const [saved, setSaved] = useState(false);
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(true);
          }}
        >
          <ActionsSection
            compact
            actions={actions}
            actionPreface=""
            onChange={setActions}
            onPrefaceChange={() => {}}
          />
          {saved && <p>Monster saved</p>}
        </form>
      );
    }
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Attack details…" }));
    fireEvent.change(screen.getByLabelText("Attack count"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getAllByLabelText("Spaces")[1], {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(
      screen.getByText("5× (Reach 2, or Shoot, Range 12)")
    ).toBeInTheDocument();
    expect(screen.queryByText("Monster saved")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Effect/ })).toHaveValue(
      "Push 1 space."
    );
    fireEvent.click(screen.getByRole("button", { name: "Attack details…" }));
    expect(screen.getByLabelText("Legacy range text")).toHaveValue(
      "within sight"
    );
    fireEvent.change(screen.getByLabelText("Attack count"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByText("5× (Reach 2, or Shoot, Range 12)")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Attack details…" }));
    expect(screen.getByLabelText("Attack count")).toHaveValue(5);
    fireEvent.change(screen.getByLabelText("Attack count"), {
      target: { value: "" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Alternative attack" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByText("(Reach 2)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Attack details…" }));
    expect(screen.getByLabelText("Attack count")).toHaveValue(null);
    expect(
      screen.getByRole("checkbox", { name: "Alternative attack" })
    ).not.toBeChecked();
  });

  it("validates a ranged cone and replaces unspecified AoE with a sized line", () => {
    function Editor() {
      const [actions, setActions] = useState<Action[]>([
        { id: "blast", name: "Blast", target: { range: 7 }, aoe: true },
      ]);
      return (
        <ActionsSection
          compact
          actions={actions}
          actionPreface=""
          onChange={setActions}
          onPrefaceChange={() => {}}
        />
      );
    }
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Attack details…" }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Area" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("option", { name: "Cone" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A cone cannot also have a ranged target"
    );
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Area" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("option", { name: "Line" }));
    fireEvent.change(screen.getByLabelText("Length (spaces)"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("(Range 7, Line 4)")).toBeInTheDocument();
  });
});
