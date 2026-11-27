import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPANION_CARD_CASES } from "@/app/dev/entities/companions/fixtures";
import { getCompanionUrl } from "@/lib/utils/url";
import { Card } from "./Card";

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => <button type="button">Upvote</button>,
}));

afterEach(cleanup);

describe("companion cards", () => {
  it("shows the tab, stat band, name link and descriptor", () => {
    const { companion } = COMPANION_CARD_CASES[0];
    render(
      <Card companion={companion} creator={companion.creator} hideActions />
    );

    expect(screen.getByText("Adventuring Companion")).toBeInTheDocument();
    expect(screen.getByText("5/LVL")).toBeInTheDocument();
    expect(screen.getByText("DEX+")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: companion.name })).toHaveAttribute(
      "href",
      getCompanionUrl(companion)
    );
    expect(screen.getByText("Small Kobold, The Cheat")).toBeInTheDocument();
  });

  it("omits the size for medium companions and the saves when empty", () => {
    const { companion } = COMPANION_CARD_CASES[2];
    render(
      <Card companion={companion} creator={companion.creator} hideActions />
    );

    expect(screen.getByText("Wolf, The Loyal Hound")).toBeInTheDocument();
    expect(screen.queryByText(/Saves:/)).not.toBeInTheDocument();
  });
});
