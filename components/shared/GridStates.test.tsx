import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CreateEmptyState, EmptyState } from "./GridStates";

afterEach(cleanup);

describe("grid empty states", () => {
  it("renders a large flame create link instead of a no-results message", () => {
    render(<CreateEmptyState href="/hazards/new" entityName="Hazard" />);

    const link = screen.getByRole("link", { name: "Create Hazard" });
    expect(link).toHaveAttribute("href", "/hazards/new");
    expect(link).toHaveClass("bg-flame", "h-14", "text-lg");
    expect(screen.queryByText(/No .* found/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("preserves the no-results message for public lists", () => {
    render(<EmptyState entityName="hazards" />);

    expect(screen.getByText("No hazards found.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
