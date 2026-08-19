import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextFormattingLab } from "./TextFormattingLab";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}));

vi.mock("@/components/layout/ModeToggle", () => ({
  ModeToggle: () => <div>Theme toggle</div>,
}));

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => null,
}));

vi.mock("@/components/shared/CardFooterLayout", () => ({
  CardFooterLayout: () => null,
}));

afterEach(cleanup);

describe("TextFormattingLab", () => {
  it("renders syntax, production component, and entity-context coverage", () => {
    const { container } = render(<TextFormattingLab />);

    expect(
      container.querySelectorAll("[data-formatting-fixture]")
    ).toHaveLength(10);
    expect(container.querySelectorAll("[data-compact-component]")).toHaveLength(
      4
    );
    expect(container.querySelectorAll("[data-entity-context]")).toHaveLength(
      40
    );
  });

  it("applies shared width, compact paragraph, and source controls", () => {
    const { container } = render(<TextFormattingLab />);

    fireEvent.click(screen.getByText("Narrow"));
    fireEvent.click(screen.getByLabelText("Compact syntax paragraphs"));
    fireEvent.click(screen.getByLabelText("Show fixture source"));

    const fixtures = container.querySelectorAll("[data-formatting-fixture]");
    expect(fixtures[0]).toHaveClass("sm:w-80");
    expect(
      fixtures[0].querySelector(".formatted-text--inline")
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll("[data-formatting-fixture] pre")
    ).toHaveLength(10);
  });
});
