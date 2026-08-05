import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DetailActionBar } from "./DetailActionBar";

afterEach(cleanup);

describe("DetailActionBar", () => {
  it("renders its actions", () => {
    render(
      <DetailActionBar>
        <button type="button">Edit</button>
        <button type="button">Delete</button>
      </DetailActionBar>
    );

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("scrolls horizontally instead of overflowing the viewport", () => {
    const { container } = render(
      <DetailActionBar>
        <button type="button">Edit</button>
      </DetailActionBar>
    );

    const scroller = container.firstElementChild;
    expect(scroller).toHaveClass("overflow-x-auto");

    // w-max lets the row grow past the scroller so nothing lands out of reach
    // at the start edge, while min-w-full keeps it right-aligned when it fits.
    const row = scroller?.firstElementChild;
    expect(row).toHaveClass("w-max", "min-w-full", "justify-end");
  });

  it("merges a caller-supplied className", () => {
    const { container } = render(
      <DetailActionBar className="mb-0">
        <button type="button">Edit</button>
      </DetailActionBar>
    );

    expect(container.firstElementChild).toHaveClass("mb-0");
  });
});
