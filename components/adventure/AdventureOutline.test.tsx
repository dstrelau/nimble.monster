import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdventureOutline } from "./AdventureOutline";

afterEach(cleanup);

describe("AdventureOutline", () => {
  it("renders ordered nested links with one colored dot per top-level section", () => {
    const { container } = render(
      <AdventureOutline
        nodes={[
          {
            id: "locations",
            parentId: null,
            orderIndex: 1,
            label: "Adventure Locations",
          },
          {
            id: "going-on",
            parentId: null,
            orderIndex: 0,
            label: "What's Going On?",
          },
          {
            id: "entrance",
            parentId: "locations",
            orderIndex: 0,
            label: "Cavern Entrance",
          },
        ]}
      />
    );

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["What's Going On?", "Adventure Locations", "Cavern Entrance"]
    );
    expect(
      screen.getByRole("link", { name: "Cavern Entrance" })
    ).toHaveAttribute("href", "#adventure-node-entrance");
    expect(container.querySelectorAll(".rounded-full")).toHaveLength(2);
    expect(container.querySelector(".bg-orange-700")).toBeInTheDocument();
    expect(container.querySelector(".bg-cyan-700")).toBeInTheDocument();
  });
});
