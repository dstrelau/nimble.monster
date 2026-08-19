import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompactComponentDemos } from "./CompactComponentDemos";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
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

describe("compact production components", () => {
  it("keeps injected paragraphs inline in every compact component", () => {
    const { container } = render(<CompactComponentDemos />);
    const components = container.querySelectorAll("[data-compact-component]");

    expect(components).toHaveLength(4);
    for (const component of components) {
      const formattedText = component.querySelector(".formatted-text--inline");
      expect(formattedText?.querySelectorAll("p")).toHaveLength(2);
    }
  });
});
