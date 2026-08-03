import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/paperforge-catalog", () => ({
  PAPERFORGE_ENTRIES: [
    { id: "2", name: "Goblin Archer", folder: "0002" },
    { id: "1", name: "Goblin Warrior", folder: "0001" },
  ],
}));

import { PaperforgeImageSelect } from "./PaperforgeImageSelect";

afterEach(cleanup);

describe("PaperforgeImageSelect", () => {
  it("renders searchable image cards and selects an image", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <PaperforgeImageSelect value={undefined} onChange={onChange} />
    );

    fireEvent.click(
      screen.getByRole("combobox", {
        name: /current selection: select image/i,
      })
    );

    const group = screen.getByRole("group");
    expect(group.closest("[cmdk-group]")).toHaveClass(
      "[&_[cmdk-group-items]]:grid-cols-3"
    );
    expect(screen.getByText("Goblin Archer")).toBeInTheDocument();
    expect(screen.getByText("Goblin Warrior")).toBeInTheDocument();
    expect(document.querySelectorAll("[cmdk-item] img")).toHaveLength(2);
    expect(document.querySelector("[cmdk-item] img")).toHaveAttribute(
      "src",
      "/paperforge/0002/50.png"
    );
    expect(document.querySelector("[cmdk-item] img")).toHaveAttribute(
      "srcset",
      "/paperforge/0002/50.png 1x, /paperforge/0002/100.png 2x"
    );
    expect(document.querySelector("[cmdk-item] img")).toHaveClass(
      "group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
    );

    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "Archer" },
    });
    expect(screen.queryByText("Goblin Warrior")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Goblin Archer"));
    expect(onChange).toHaveBeenCalledWith("2");

    rerender(<PaperforgeImageSelect value="2" onChange={onChange} />);
    fireEvent.click(
      screen.getByRole("combobox", {
        name: /current selection: goblin archer/i,
      })
    );
    const selectedItem = screen
      .getByText("Goblin Archer")
      .closest("[cmdk-item]");
    expect(selectedItem).toHaveClass("data-[selected=true]:bg-transparent");
    expect(selectedItem?.querySelector("img")).toHaveClass(
      "bg-accent",
      "rounded-full",
      "ring-2",
      "ring-amber-500",
      "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
      "group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});
