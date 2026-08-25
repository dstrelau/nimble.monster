import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/lib/services/items";
import type { User } from "@/lib/types";
import { ItemCardPrinter } from "./ItemCardPrinter";

const creator: User = {
  id: "creator",
  discordId: "creator",
  username: "creator",
  displayName: "Creator",
};

const items: Item[] = Array.from({ length: 10 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  name: `Item ${index + 1}`,
  description: "Description",
  rarity: "common",
  visibility: "public",
  creator,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
}));

vi.mock("@/app/collections/SelectableItemGrid", () => ({
  SelectableItemGrid: ({ onToggle }: { onToggle: (item: Item) => void }) => (
    <div>
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onToggle(item)}>
          Select {item.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/item/Card", () => ({
  Card: ({ item }: { item: Item }) => <div>{item.name}</div>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ItemCardPrinter", () => {
  it("automatically adds physically sized pages after nine cards", () => {
    const { container } = render(<ItemCardPrinter />);

    for (const item of items) {
      fireEvent.click(
        screen.getByRole("button", { name: `Select ${item.name}` })
      );
    }

    expect(screen.getByText("10 selected")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    const sheets = container.querySelectorAll<HTMLElement>(
      ".item-card-print-sheet"
    );
    const cards = container.querySelectorAll<HTMLElement>("[data-print-card]");

    expect(sheets).toHaveLength(2);
    expect(sheets[0]).toHaveStyle({ width: "215.9mm", height: "279.4mm" });
    expect(sheets[0].style.gridTemplateColumns).toBe("repeat(3, 64.5mm)");
    expect(sheets[0].style.gridTemplateRows).toBe("repeat(3, 89mm)");
    expect(sheets[0]).toHaveAttribute("data-active", "false");
    expect(sheets[1]).toHaveAttribute("data-active", "true");
    expect(sheets[0].querySelectorAll("[data-print-card]")).toHaveLength(9);
    expect(sheets[1].querySelectorAll("[data-print-card]")).toHaveLength(1);
    expect(cards).toHaveLength(10);
    expect(cards[0]).toHaveStyle({
      width: "63.5mm",
      height: "88mm",
      margin: "0.5mm",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Previous print page" })
    );
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(sheets[0]).toHaveAttribute("data-active", "true");

    fireEvent.click(screen.getByRole("button", { name: "Next print page" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item 10" }));
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(container.querySelectorAll(".item-card-print-sheet")).toHaveLength(
      1
    );
  });

  it("prints only after at least one card is selected", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const { container } = render(<ItemCardPrinter />);

    const printButton = screen.getByRole("button", { name: "Print cards" });
    expect(printButton).toBeDisabled();
    expect(container.querySelectorAll(".item-card-print-sheet")).toHaveLength(
      1
    );
    expect(
      container.querySelectorAll(".item-card-print-placeholder")
    ).toHaveLength(9);

    fireEvent.click(screen.getByRole("button", { name: "Select Item 1" }));
    expect(printButton).toBeEnabled();
    expect(
      container.querySelectorAll(".item-card-print-placeholder")
    ).toHaveLength(8);
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalledOnce();
  });
});
