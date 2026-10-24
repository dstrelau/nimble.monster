import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "./GridStates";

afterEach(cleanup);

describe("grid empty states", () => {
  it("preserves the no-results message for public lists", () => {
    render(<EmptyState entityName="hazards" />);

    expect(screen.getByText("No hazards found.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
