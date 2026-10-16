import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/paperforge-catalog", () => {
  const entries = [
    { id: "2", name: "Goblin Archer", folder: "0002" },
    { id: "1", name: "Goblin Warrior", folder: "0001" },
  ];
  return {
    PAPERFORGE_ENTRIES: entries,
    getPaperforgeEntry: (id: string) =>
      entries.find((entry) => entry.id === id),
  };
});

import { PaperforgeImageSelect } from "./PaperforgeImageSelect";

afterEach(cleanup);

describe("PaperforgeImageSelect", () => {
  it("chooses and clears a portrait through a modal, preserving it on dismissal", () => {
    function Editor() {
      const [value, setValue] = useState<string>();
      return (
        <PaperforgeImageSelect portrait value={value} onChange={setValue} />
      );
    }
    render(<Editor />);

    expect(screen.queryByText("Image")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose image" }));
    expect(
      screen.getByRole("dialog", { name: "Choose image" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear image" })).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "Search images" }), {
      target: { value: "Warrior" },
    });
    expect(screen.queryByText("Goblin Archer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Goblin Warrior" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Goblin Warrior" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear image" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /change image/i }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.getByRole("img", { name: "Goblin Warrior" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /change image/i }));
    fireEvent.click(screen.getByRole("button", { name: "Clear image" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose image" })
    ).toBeInTheDocument();
  });

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
