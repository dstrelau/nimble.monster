import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Ability } from "@/lib/types";
import { AbilitiesSection } from "./AbilitiesSection";

// Only mock what causes the next-auth import issue
vi.mock("@/components/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => <div>validation-icon</div>,
}));

afterEach(() => {
  cleanup();
});

describe("AbilitiesSection", () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    mockOnChange.mockClear();
  });

  it("maintains focus when typing in ability name", () => {
    const abilities: Ability[] = [{ id: "test-1", name: "", description: "" }];
    render(<AbilitiesSection abilities={abilities} onChange={mockOnChange} />);

    const nameInput = screen.getByLabelText("Name");
    nameInput.focus();

    fireEvent.change(nameInput, { target: { value: "Fire" } });

    expect(document.activeElement).toBe(nameInput);
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-1", name: "Fire", description: "" },
    ]);
  });

  it("maintains focus when typing in ability description", () => {
    const abilities: Ability[] = [
      { id: "test-1", name: "Fireball", description: "" },
    ];
    render(<AbilitiesSection abilities={abilities} onChange={mockOnChange} />);

    const descInput = screen.getByRole("textbox", { name: /description/i });
    descInput.focus();

    fireEvent.change(descInput, { target: { value: "Deals fire damage" } });

    expect(document.activeElement).toBe(descInput);
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-1", name: "Fireball", description: "Deals fire damage" },
    ]);
  });

  it("adds new ability when add button is clicked", () => {
    const abilities: Ability[] = [
      { id: "test-1", name: "Existing", description: "Test" },
    ];
    render(<AbilitiesSection abilities={abilities} onChange={mockOnChange} />);

    const addButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-1", name: "Existing", description: "Test" },
      { id: expect.any(String), name: "", description: "" },
    ]);
  });

  it("removes ability when remove button is clicked", () => {
    const abilities: Ability[] = [
      { id: "test-1", name: "First", description: "First desc" },
      { id: "test-2", name: "Second", description: "Second desc" },
    ];
    render(<AbilitiesSection abilities={abilities} onChange={mockOnChange} />);

    const removeButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector('svg[class*="trash"]'));
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-2", name: "Second", description: "Second desc" },
    ]);
  });

  it("removes correct ability when multiple exist", () => {
    const abilities: Ability[] = [
      { id: "test-1", name: "First", description: "First desc" },
      { id: "test-2", name: "Second", description: "Second desc" },
      { id: "test-3", name: "Third", description: "Third desc" },
    ];
    render(<AbilitiesSection abilities={abilities} onChange={mockOnChange} />);

    const removeButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector('svg[class*="trash"]'));
    fireEvent.click(removeButtons[1]); // Remove middle ability

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: "test-1", name: "First", description: "First desc" },
      { id: "test-3", name: "Third", description: "Third desc" },
    ]);
  });

  it("renders empty state with add button", () => {
    render(<AbilitiesSection abilities={[]} onChange={mockOnChange} />);

    expect(screen.getByText("Abilities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});
