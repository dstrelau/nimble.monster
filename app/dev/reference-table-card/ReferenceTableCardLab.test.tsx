import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RandomTableSchema } from "@/lib/random-table-schema";
import { CARD_FIXTURES } from "./fixtures";
import { OverviewCard, ReferenceTableCardLab } from "./ReferenceTableCardLab";

vi.mock("@/components/shared/FormattedText", () => ({
  FormattedText: ({ content }: { content: string }) => <span>{content}</span>,
}));

afterEach(cleanup);

describe("Reference Table card lab", () => {
  it("compares three designs for every valid fixture and changes preview width", () => {
    for (const fixture of CARD_FIXTURES) {
      expect(RandomTableSchema.safeParse(fixture.table).success).toBe(true);
    }
    render(<ReferenceTableCardLab />);
    expect(screen.getAllByRole("article")).toHaveLength(15);
    expect(screen.getAllByRole("table")).toHaveLength(5);
    expect(screen.getAllByText("Private")).toHaveLength(3);
    const regions = screen.getAllByRole("region");
    expect(regions.map((region) => region.getAttribute("aria-label"))).toEqual([
      "A · Contents list",
      "B · Data preview",
      "C · Column outline",
    ]);
    for (const region of regions) {
      expect(within(region).getAllByRole("article")).toHaveLength(5);
      for (const fixture of CARD_FIXTURES) {
        expect(
          within(region).getByRole("heading", {
            name: fixture.table.name,
            level: 3,
          })
        ).toBeInTheDocument();
      }
    }
    fireEvent.click(screen.getByRole("radio", { name: "Narrow" }));
    for (const article of screen.getAllByRole("article")) {
      expect(article).toHaveClass("max-w-72");
    }
    fireEvent.click(screen.getByRole("radio", { name: "Standard" }));
    for (const article of screen.getAllByRole("article")) {
      expect(article).toHaveClass("max-w-96");
      expect(article).not.toHaveClass("max-w-72");
    }
  });

  it("previews only the first two rows and three columns without header totals", () => {
    render(<OverviewCard table={CARD_FIXTURES[2].table} option="preview" />);
    expect(screen.queryByText("2 tables")).not.toBeInTheDocument();
    expect(screen.queryByText("23 rows")).not.toBeInTheDocument();
    expect(screen.getByText("+14 more rows")).toBeInTheDocument();
    expect(screen.getByText("+1 more column")).toBeInTheDocument();
    expect(screen.getByText("+1 other table")).toBeInTheDocument();
    const preview = screen.getByRole("table", { name: "Melee Weapons sample" });
    expect(within(preview).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(preview).getAllByRole("row")).toHaveLength(3);
    expect(within(preview).getByText("Properties")).toBeInTheDocument();
    expect(within(preview).getByText("Dagger")).toBeInTheDocument();
    expect(within(preview).getByText("Sickle")).toBeInTheDocument();
    expect(within(preview).getByText("1d4+DEX piercing")).toBeInTheDocument();
    expect(within(preview).queryByText("Cost")).not.toBeInTheDocument();
  });

  it("labels omitted subtables and columns rather than silently dropping them", () => {
    const { rerender } = render(
      <OverviewCard table={CARD_FIXTURES[1].table} option="contents" />
    );
    expect(screen.getByText("Plate")).toBeInTheDocument();
    expect(screen.queryByText("Shields")).not.toBeInTheDocument();
    expect(screen.queryByText("5 tables")).not.toBeInTheDocument();
    expect(screen.queryByText("20 rows")).not.toBeInTheDocument();
    expect(screen.queryByText("3 columns")).not.toBeInTheDocument();
    expect(screen.getAllByText("4 rows")).toHaveLength(4);
    expect(screen.getByText("+1 more table")).toBeInTheDocument();
    rerender(<OverviewCard table={CARD_FIXTURES[1].table} option="columns" />);
    expect(screen.getByRole("heading", { name: "Mail" })).toBeInTheDocument();
    expect(screen.queryByText("Plate")).not.toBeInTheDocument();
    expect(screen.getByText("+2 more tables")).toBeInTheDocument();
    rerender(<OverviewCard table={CARD_FIXTURES[4].table} option="columns" />);
    expect(screen.getByText("Damage")).toBeInTheDocument();
    expect(screen.queryByText("Range")).not.toBeInTheDocument();
    expect(screen.getByText("+6 columns")).toBeInTheDocument();
  });

  it("shows all of a sparse preview without an overflow message or fabricated description", () => {
    const { container } = render(
      <OverviewCard table={CARD_FIXTURES[0].table} option="preview" />
    );
    expect(screen.queryByText("1 table")).not.toBeInTheDocument();
    expect(screen.getByText("5 gp")).toBeInTheDocument();
    expect(screen.getByText("20 gp")).toBeInTheDocument();
    expect(screen.queryByText(/more|other tables/)).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-description"]')
    ).toBeNull();
  });
});
