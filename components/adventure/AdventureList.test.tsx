import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdventureOverview } from "@/lib/db/adventures";
import { AdventureList } from "./AdventureList";

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: ({ entityType }: { entityType: string }) => (
    <button type="button">Like {entityType}</button>
  ),
}));

afterEach(cleanup);

const adventure: AdventureOverview = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "The Hidden Honey Cavern",
  tagline: "A sticky quest",
  summary: "Explore the cavern.",
  visibility: "private",
  creator: {
    id: "creator",
    discordId: "creator-discord",
    username: "test-author",
    displayName: "Test Author",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("AdventureList", () => {
  it("links only the title and shows private visibility in the footer", () => {
    render(<AdventureList adventures={[adventure]} />);

    expect(screen.getByRole("link", { name: adventure.name })).toHaveAttribute(
      "href",
      "/adventures/the-hidden-honey-cavern-00000000000000000000000001"
    );
    expect(
      screen.getByRole("heading", { level: 2, name: adventure.name })
    ).toBeInTheDocument();
    expect(screen.getByText("A sticky quest")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Test Author/ })).toHaveAttribute(
      "href",
      "/u/test-author"
    );
    expect(
      screen.getByRole("button", { name: "Like adventure" })
    ).toBeInTheDocument();
  });

  it("does not label public adventures", () => {
    render(
      <AdventureList adventures={[{ ...adventure, visibility: "public" }]} />
    );

    expect(screen.queryByText("Public")).not.toBeInTheDocument();
    expect(screen.queryByText("Private")).not.toBeInTheDocument();
  });

  it("renders an empty state", () => {
    render(<AdventureList adventures={[]} />);

    expect(
      screen.getByText(
        "No adventures yet. Create your first adventure to get started!"
      )
    ).toBeInTheDocument();
  });
});
