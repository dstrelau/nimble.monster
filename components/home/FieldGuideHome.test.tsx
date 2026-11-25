import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { findMonsteryMondayWeek } from "@/lib/services/collections/queries";
import { FieldGuideHome } from "./FieldGuideHome";

const overview = vi.hoisted(() => ({
  counts: { monsters: 0, items: 0 },
  creators: [] as unknown[],
}));

vi.mock("@/lib/services/monsters/service", () => ({
  monstersService: {
    paginatePublicMonsters: async () => ({ data: [], nextCursor: null }),
  },
}));
vi.mock("@/lib/services/classes/repository", () => ({
  findOfficialClassesByNames: async () => new Map(),
}));
vi.mock("@/lib/services/collections/queries", () => ({
  findMonsteryMondayWeek: vi.fn(async () => null),
  getMonsteryMondayOverview: async () => overview,
}));

afterEach(cleanup);

it("credits the artist and offers real destinations even without previews", async () => {
  render(await FieldGuideHome({ signedIn: false }));
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
  expect(screen.getByText("Sign in to publish.")).toBeInTheDocument();
  expect(
    screen.getByText(/The next creature could be yours/)
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
    "href",
    "/monstery-monday"
  );
});

it("links the banner to Week 100 once it is posted", async () => {
  vi.mocked(findMonsteryMondayWeek).mockResolvedValueOnce({
    id: "a72a95b3-8b5d-4755-86f7-4d1e3adcf400",
    name: "Monstery Monday Week 100 - Mix-up",
  });
  overview.counts = { monsters: 599, items: 147 };
  overview.creators = Array.from({ length: 43 });
  render(await FieldGuideHome({ signedIn: true }));
  expect(findMonsteryMondayWeek).toHaveBeenCalledWith(100);
  expect(
    screen.getByRole("link", { name: "Explore" }).getAttribute("href")
  ).toMatch(/^\/collections\/.+/);
  // Every number rounds down: 599 is not yet "over 600".
  expect(
    screen.getByText(
      "Over 590 themed monsters, 140 items, and more from 40 creators."
    )
  ).toBeInTheDocument();
  expect(screen.queryByText("Sign in to publish.")).not.toBeInTheDocument();
});
