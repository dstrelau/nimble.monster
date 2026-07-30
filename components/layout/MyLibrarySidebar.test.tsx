import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MyLibraryCounts } from "@/lib/db/my-library";
import { MyLibrarySidebar } from "./MyLibrarySidebar";

let pathname = "/my/monsters";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  pathname = "/my/monsters";
});

const counts: MyLibraryCounts = {
  monsters: 12,
  families: 3,
  companions: 2,
  encounters: 4,
  ancestries: 5,
  backgrounds: 6,
  classes: 7,
  subclasses: 8,
  "spell-schools": 9,
  items: 10,
  collections: 11,
  rules: 13,
};

describe("MyLibrarySidebar", () => {
  it("shows every library section with its count and active state", () => {
    render(<MyLibrarySidebar counts={counts} />);

    const navigation = screen.getByRole("navigation", {
      name: "My library sidebar",
    });
    const links = within(navigation).getAllByRole("link");

    expect(
      within(navigation)
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual(["Bestiary", "Heroes", "Gear", "Adventures"]);
    expect(links).toHaveLength(12);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/my/monsters",
      "/my/families",
      "/my/companions",
      "/my/ancestries",
      "/my/backgrounds",
      "/my/classes",
      "/my/subclasses",
      "/my/spell-schools",
      "/my/items",
      "/my/encounters",
      "/my/collections",
      "/my/rules",
    ]);
    expect(
      within(navigation).getByRole("link", { name: "Monsters 12" })
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByRole("link", { name: "Collections 11" })
    ).not.toHaveAttribute("aria-current");
    expect(
      within(navigation).getByRole("link", { name: "Custom Rules 13" })
    ).toHaveAttribute("href", "/my/rules");
  });

  it("opens the library navigation on smaller screens", () => {
    render(<MyLibrarySidebar counts={counts} />);

    fireEvent.click(
      screen.getByRole("button", { name: /My Library Monsters/ })
    );

    expect(
      screen.getByRole("navigation", { name: "My library menu" })
    ).toBeInTheDocument();
  });

  it("reuses every entity link for a public profile", () => {
    pathname = "/u/creator/monsters";
    render(
      <MyLibrarySidebar counts={counts} profileHref="/u/creator" title={null} />
    );

    const navigation = screen.getByRole("navigation", {
      name: "Public library sidebar",
    });
    const links = within(navigation).getAllByRole("link");

    expect(links).toHaveLength(12);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/u/creator/monsters",
      "/u/creator/families",
      "/u/creator/companions",
      "/u/creator/ancestries",
      "/u/creator/backgrounds",
      "/u/creator/classes",
      "/u/creator/subclasses",
      "/u/creator/spell-schools",
      "/u/creator/items",
      "/u/creator/encounters",
      "/u/creator/collections",
      "/u/creator/rules",
    ]);
    expect(
      within(navigation).getByRole("link", { name: "Monsters 12" })
    ).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("Public Library")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Monsters" })
    ).toBeInTheDocument();
  });
});
