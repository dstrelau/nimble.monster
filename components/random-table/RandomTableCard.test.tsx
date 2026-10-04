import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import equipmentTables from "@/data/official/core/equipment-tables.json";
import type { RandomTable } from "@/lib/types";
import { RandomTableCard } from "./RandomTableCard";

vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

const armor: RandomTable = {
  ...equipmentTables.data[0].attributes,
  id: "00000000-0000-0000-0000-000000000001",
  visibility: "public",
  creator: {
    id: "creator",
    discordId: "",
    username: "nimble-co",
    displayName: "Nimble Co.",
  },
};

afterEach(cleanup);

describe("RandomTableCard", () => {
  it("uses the simplified contents design and links to the full table", () => {
    const { container } = render(<RandomTableCard randomTable={armor} />);
    const titleLink = screen.getByRole("link", { name: "Armor & Defense" });
    const overflowLink = screen.getByRole("link", { name: "+1 more table" });
    expect(titleLink).toHaveAttribute(
      "href",
      "/random-tables/armor-defense-00000000000000000000000001"
    );
    expect(overflowLink).toHaveAttribute(
      "href",
      titleLink.getAttribute("href")
    );
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(within(list).getAllByText("4 rows")).toHaveLength(4);
    expect(screen.getByText("Plate")).toBeInTheDocument();
    expect(screen.queryByText("Shields")).not.toBeInTheDocument();
    expect(screen.queryByText("3 columns")).not.toBeInTheDocument();
    expect(screen.queryByText("20 rows")).not.toBeInTheDocument();
    expect(screen.queryByText("5 tables")).not.toBeInTheDocument();
    expect(container.querySelector(".lucide-table-2")).not.toBeNull();
    expect(screen.getByRole("link", { name: /Nimble Co\./ })).toHaveAttribute(
      "href",
      "/u/nimble-co"
    );
  });

  it("keeps full formatted descriptions intact and clamps them visually", () => {
    const description = `${"An introductory sentence. ".repeat(5)}**Important**`;
    const { container } = render(
      <RandomTableCard randomTable={{ ...armor, description }} />
    );
    const descriptionElement = container.querySelector(
      '[data-slot="card-description"]'
    );
    expect(descriptionElement).toHaveClass("line-clamp-2");
    expect(descriptionElement?.querySelector("strong")).toHaveTextContent(
      "Important"
    );
    expect(
      descriptionElement?.querySelector(".formatted-text--inline")
    ).not.toBeNull();
  });

  it("shows the source badge only for sourced tables", () => {
    const { rerender } = render(<RandomTableCard randomTable={armor} />);
    expect(screen.queryByText("Core3")).not.toBeInTheDocument();
    rerender(
      <RandomTableCard
        randomTable={{
          ...armor,
          source: {
            id: "core3",
            name: "Core Rules 3.0",
            abbreviation: "Core3",
            license: "Nimble 3rd Party Creator License v2.0",
            link: "https://nimblerpg.com/",
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-01"),
          },
        }}
      />
    );
    expect(screen.getByText("Core3")).toBeInTheDocument();
  });

  it("preserves private and ID-less previews, custom limits, and unequal row counts", () => {
    render(
      <RandomTableCard
        randomTable={{
          ...armor,
          id: "",
          description: undefined,
          visibility: "private",
          subtables: armor.subtables.map((table, index) => ({
            ...table,
            rows: table.rows.slice(0, index === 0 ? 1 : 3),
          })),
        }}
        limit={2}
      />
    );
    expect(
      screen.queryByRole("link", { name: "Armor & Defense" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 row")).toBeInTheDocument();
    expect(screen.getByText("3 rows")).toBeInTheDocument();
    expect(screen.getByText("+3 more tables")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.queryByText("Mail")).not.toBeInTheDocument();
  });
});
