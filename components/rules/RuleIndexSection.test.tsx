import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RuleIndexSection } from "./RuleIndexSection";

afterEach(cleanup);

describe("RuleIndexSection", () => {
  it("renders rules as a vertical section list", () => {
    render(
      <RuleIndexSection
        label="Reactions"
        color="text-red-700"
        rules={[
          { slug: "defend", href: "/rules/defend", title: "Defend" },
          {
            slug: "interpose",
            href: "/rules/interpose",
            title: "Interpose",
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Reactions" })).toBeVisible();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Defend" })).toHaveAttribute(
      "href",
      "/rules/defend"
    );
    expect(screen.getByRole("link", { name: "Interpose" })).toHaveAttribute(
      "href",
      "/rules/interpose"
    );
  });
});
