import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockListCustomRulesForUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockListCustomRulesForUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/custom-rule", () => ({
  listCustomRulesForUser: mockListCustomRulesForUser,
}));
vi.mock("@/lib/utils/url", () => ({
  getCustomRuleUrl: (rule: { id: string }) => `/custom-rules/${rule.id}`,
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

import MyRulesPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MyRulesPage", () => {
  it("lists all rules owned by the current user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockListCustomRulesForUser.mockResolvedValue([
      {
        id: "rule-1",
        name: "Gritty Wounds",
        visibility: "public",
        links: [{ ruleSlug: "wounds", relation: "augments" }],
      },
      {
        id: "rule-2",
        name: "Secret Initiative",
        visibility: "private",
        links: [],
      },
    ]);

    render(await MyRulesPage());

    expect(mockListCustomRulesForUser).toHaveBeenCalledWith("user-1");
    expect(screen.getByRole("link", { name: /Gritty Wounds/ })).toHaveAttribute(
      "href",
      "/custom-rules/rule-1"
    );
    expect(
      screen.getByRole("link", { name: /Secret Initiative/ })
    ).toHaveAttribute("href", "/custom-rules/rule-2");
    expect(screen.getByText("1 linked official rule")).toBeInTheDocument();
    expect(screen.getByText("No linked official rules")).toBeInTheDocument();
  });
});
