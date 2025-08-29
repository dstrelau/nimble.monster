import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionsSection } from "./ActionsSection";
import type { Action } from "@/lib/types";

// Only mock what causes the next-auth import issue
vi.mock("@/components/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => <div>validation-icon</div>,
}));

afterEach(() => {
  cleanup();
});

describe("ActionsSection", () => {
  const mockOnChange = vi.fn();
  const mockOnPrefaceChange = vi.fn();

  it("maintains focus when typing in action name", () => {
    const actions: Action[] = [{ name: "", damage: "", description: "" }];
    render(<ActionsSection actions={actions} actionPreface="" onChange={mockOnChange} onPrefaceChange={mockOnPrefaceChange} />);

    const nameInput = screen.getByLabelText("Name");
    nameInput.focus();
    
    fireEvent.change(nameInput, { target: { value: "Fireball" } });
    
    expect(document.activeElement).toBe(nameInput);
    expect(mockOnChange).toHaveBeenCalledWith([{ name: "Fireball", damage: "", description: "" }]);
  });

  it("maintains focus when typing in action description", () => {
    const actions: Action[] = [{ name: "Fireball", damage: "1d6", description: "" }];
    render(<ActionsSection actions={actions} actionPreface="" onChange={mockOnChange} onPrefaceChange={mockOnPrefaceChange} />);

    const descInput = screen.getByRole("textbox", { name: /description/i });
    descInput.focus();
    
    fireEvent.change(descInput, { target: { value: "Deals fire damage" } });
    
    expect(document.activeElement).toBe(descInput);
    expect(mockOnChange).toHaveBeenCalledWith([{ name: "Fireball", damage: "1d6", description: "Deals fire damage" }]);
  });

  it("adds new action when add button is clicked", () => {
    const actions: Action[] = [{ name: "Existing", damage: "1d4", description: "Test" }];
    render(<ActionsSection actions={actions} actionPreface="" onChange={mockOnChange} onPrefaceChange={mockOnPrefaceChange} />);

    const addButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      { name: "Existing", damage: "1d4", description: "Test" },
      { name: "", damage: "", description: "" }
    ]);
  });

  it("removes action when remove button is clicked", () => {
    const actions: Action[] = [
      { name: "First", damage: "1d4", description: "First desc" },
      { name: "Second", damage: "1d6", description: "Second desc" }
    ];
    render(<ActionsSection actions={actions} actionPreface="" onChange={mockOnChange} onPrefaceChange={mockOnPrefaceChange} />);

    const removeButtons = screen.getAllByRole("button").filter(btn => 
      btn.querySelector('svg[class*="trash"]')
    );
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([
      { name: "Second", damage: "1d6", description: "Second desc" }
    ]);
  });

  it("updates action preface", () => {
    const actions: Action[] = [];
    render(<ActionsSection actions={actions} actionPreface="" onChange={mockOnChange} onPrefaceChange={mockOnPrefaceChange} />);

    const prefaceInput = screen.getByLabelText("Preface");
    fireEvent.change(prefaceInput, { target: { value: "The monster can make the following attacks:" } });

    expect(mockOnPrefaceChange).toHaveBeenCalledWith("The monster can make the following attacks:");
  });

  it("renders empty state with add button and preface field", () => {
    render(<ActionsSection actions={[]} actionPreface="" onChange={mockOnChange} onPrefaceChange={mockOnPrefaceChange} />);

    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByLabelText("Preface")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});