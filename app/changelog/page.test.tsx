import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ChangelogPage from "./page";

afterEach(() => {
  cleanup();
});

describe("ChangelogPage", () => {
  it("shows reference tables for everyone without authentication or a feature flag", () => {
    render(<ChangelogPage />);

    expect(screen.getByText("Add Reference Tables.")).toBeInTheDocument();
    expect(
      screen.getByText("Hazards can now have optional HP.")
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .slice(0, 3)
        .map((heading) => heading.textContent)
    ).toEqual(["9 October 2026", "5 October 2026", "4 October 2026"]);
  });
});
