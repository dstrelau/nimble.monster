import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FieldGuideHome } from "./FieldGuideHome";

vi.mock("@/lib/services/monsters/service", () => ({
  monstersService: {
    paginatePublicMonsters: async () => ({ data: [], nextCursor: null }),
  },
}));
vi.mock("@/lib/services/classes/repository", () => ({
  findOfficialClassesByNames: async () => new Map(),
}));

afterEach(cleanup);

it("credits the artist and offers real destinations even without previews", async () => {
  render(await FieldGuideHome());
  expect(
    screen.getByText(
      /Some artwork copyright Daniel F. Walthall, used with permission/
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "CC BY 4.0 license" })
  ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  expect(screen.getByRole("link", { name: "Backgrounds" })).toHaveAttribute(
    "href",
    "/backgrounds"
  );
  expect(screen.getByRole("link", { name: "Subclasses" })).toHaveAttribute(
    "href",
    "/subclasses"
  );
  expect(
    screen.getByRole("link", { name: "Share your creation" })
  ).toHaveAttribute("href", "/my/library");
  expect(
    screen.getByText(/The next creature could be yours/)
  ).toBeInTheDocument();
});
