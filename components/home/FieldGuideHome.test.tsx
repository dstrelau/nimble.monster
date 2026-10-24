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

it("labels every illustration as temporary art and offers real destinations even without previews", async () => {
  render(await FieldGuideHome());
  expect(
    screen.getAllByRole("img", {
      name: /FPO temporary AI-generated placeholder, to be replaced by a human commission/,
    })
  ).toHaveLength(3);
  expect(screen.getAllByText("PLACEHOLDER · HUMAN ART TO COME")).toHaveLength(
    3
  );
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
