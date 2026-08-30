import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
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
  hazards: 14,
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
  adventures: 2,
  "random-tables": 5,
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
    ).toEqual(["Bestiary", "Heroes", "Gear", "Play"]);
    expect(links).toHaveLength(14);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/my/monsters",
      "/my/hazards",
      "/my/families",
      "/my/companions",
      "/my/ancestries",
      "/my/backgrounds",
      "/my/classes",
      "/my/subclasses",
      "/my/spell-schools",
      "/my/items",
      "/my/adventures",
      "/my/encounters",
      "/my/rules",
      "/my/collections",
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
    expect(
      within(navigation).getByRole("link", { name: "Adventures 2" })
    ).toHaveAttribute("href", "/my/adventures");
    expect(
      within(navigation).queryByText("Random Tables")
    ).not.toBeInTheDocument();
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

    expect(links).toHaveLength(14);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/u/creator/monsters",
      "/u/creator/hazards",
      "/u/creator/families",
      "/u/creator/companions",
      "/u/creator/ancestries",
      "/u/creator/backgrounds",
      "/u/creator/classes",
      "/u/creator/subclasses",
      "/u/creator/spell-schools",
      "/u/creator/items",
      "/u/creator/adventures",
      "/u/creator/encounters",
      "/u/creator/rules",
      "/u/creator/collections",
    ]);
    expect(
      within(navigation).getByRole("link", { name: "Monsters 12" })
    ).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("Public Library")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Monsters" })
    ).toBeInTheDocument();
  });

  it("shows Adventures when its count is zero", () => {
    render(
      <MyLibrarySidebar counts={{ ...counts, adventures: 0, monsters: 0 }} />
    );

    const navigation = screen.getByRole("navigation", {
      name: "My library sidebar",
    });
    expect(
      within(navigation).getByRole("link", { name: "Adventures 0" })
    ).toHaveAttribute("href", "/my/adventures");
    expect(
      within(navigation).getByRole("link", { name: "Monsters 0" })
    ).toBeInTheDocument();
  });

  it("shows Adventures for a profile with no public adventures", () => {
    pathname = "/u/creator/adventures";
    render(
      <MyLibrarySidebar
        counts={{ ...counts, adventures: 0 }}
        profileHref="/u/creator"
        title={null}
      />
    );

    const navigation = screen.getByRole("navigation", {
      name: "Public library sidebar",
    });
    expect(
      within(navigation).getByRole("link", { name: "Adventures 0" })
    ).toHaveAttribute("href", "/u/creator/adventures");
    expect(
      within(navigation).getByRole("link", { name: "Monsters 12" })
    ).toBeInTheDocument();
  });

  it("shows random tables only in an enabled user's own library", () => {
    render(
      <FeatureFlagsProvider enabledFeatures={["random-tables"]}>
        <MyLibrarySidebar counts={counts} />
      </FeatureFlagsProvider>
    );

    const navigation = screen.getByRole("navigation", {
      name: "My library sidebar",
    });
    expect(
      within(navigation).getByRole("link", { name: "Random Tables 5" })
    ).toHaveAttribute("href", "/my/random-tables");
  });

  it("does not add random tables to public profiles", () => {
    render(
      <FeatureFlagsProvider enabledFeatures={["random-tables"]}>
        <MyLibrarySidebar
          counts={counts}
          profileHref="/u/creator"
          title={null}
        />
      </FeatureFlagsProvider>
    );

    expect(screen.queryByText("Random Tables")).not.toBeInTheDocument();
  });
});
