import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ItemMini } from "@/lib/services/items";
import { List } from "./List";

vi.mock("@/components/icons/GameIcon", () => ({
  GameIcon: ({ iconId }: { iconId: string }) => (
    <svg data-testid={`icon-${iconId}`} aria-label={iconId} />
  ),
}));

afterEach(() => {
  cleanup();
});

const items: ItemMini[] = [
  {
    id: "one",
    name: "Common Item",
    kind: "Wondrous object",
    rarity: "common",
    visibility: "public",
    imageIcon: "emerald",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "two",
    name: "Very Rare Item",
    rarity: "very_rare",
    visibility: "public",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

describe("Item List", () => {
  it("aligns mixed icon rows and separates kind from rarity", () => {
    render(<List items={items} selectedIds={[]} handleItemClick={vi.fn()} />);

    const icon = screen.getByTestId("icon-emerald");
    expect(icon.parentElement).toHaveClass("size-8", "shrink-0");
    expect(
      screen.getByText("Common Item").nextElementSibling
    ).toHaveTextContent("Wondrous object (Common)");
    expect(
      screen.getByText("Very Rare Item").nextElementSibling
    ).toHaveTextContent("(Very rare)");
  });

  it("supports pointer and keyboard selection for clickable rows", () => {
    const handleItemClick = vi.fn();
    render(
      <List items={items} selectedIds={[]} handleItemClick={handleItemClick} />
    );

    const rows = screen.getAllByRole("button");
    fireEvent.click(rows[0]);
    fireEvent.keyDown(rows[1], { key: " " });

    expect(handleItemClick.mock.calls).toEqual([["one"], ["two"]]);
  });

  it("uses labeled checkbox controls when requested", () => {
    const handleItemClick = vi.fn();
    render(
      <List
        items={items}
        selectedIds={["one"]}
        handleItemClick={handleItemClick}
        showChecks
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Select Common Item",
    });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(handleItemClick).toHaveBeenCalledWith("one");
  });
});
