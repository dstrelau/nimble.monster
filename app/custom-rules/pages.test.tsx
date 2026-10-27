import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { CustomRule } from "@/lib/db/custom-rule";
import { slugify } from "@/lib/utils/slug";

const { mockAuth, mockFindCustomRule } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindCustomRule: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/custom-rule", () => ({
  findCustomRule: mockFindCustomRule,
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/components/HydratedEntityDetail", () => ({
  HydratedEntityDetail: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => null,
}));
vi.mock("@/components/ReportEntityDialog", () => ({
  ReportEntityDialog: () => null,
}));
vi.mock("@/components/shared/Attribution", () => ({
  Attribution: () => null,
}));
vi.mock("./CustomRuleBody", () => ({ CustomRuleBody: () => null }));
vi.mock("./CustomRuleForm", () => ({
  CustomRuleForm: () => <form aria-label="Custom rule editor" />,
}));

import EditCustomRulePage from "./[id]/edit/page";
import CustomRulePage from "./[id]/page";
import NewCustomRulePage from "./new/page";

const rule: CustomRule = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Safe Rest",
  content: "Rest safely.",
  keywords: "rest",
  visibility: "public",
  likeCount: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  links: [],
  creator: {
    id: "creator",
    discordId: "creator-discord",
    username: "creator",
    displayName: "Creator",
  },
};

beforeEach(() => {
  mockAuth.mockResolvedValue(null);
  mockFindCustomRule.mockResolvedValue(rule);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("links the public custom-rule breadcrumb to the rules reference", async () => {
  render(
    await CustomRulePage({ params: Promise.resolve({ id: slugify(rule) }) })
  );

  const breadcrumb = within(screen.getByRole("navigation"));
  expect(breadcrumb.getByRole("link", { name: "Rules" })).toHaveAttribute(
    "href",
    "/rules"
  );
  expect(breadcrumb.getByText(rule.name)).toBeInTheDocument();
});

it("sends logged-out creation to sign-in with a return to the form", async () => {
  await expect(NewCustomRulePage()).rejects.toThrow(
    "REDIRECT:/api/auth/signin?callbackUrl=/custom-rules/new"
  );
});

it("sends logged-out editing to sign-in with a return to that rule", async () => {
  await expect(
    EditCustomRulePage({ params: Promise.resolve({ id: rule.id }) })
  ).rejects.toThrow(
    "REDIRECT:/api/auth/signin?callbackUrl=%2Fcustom-rules%2F11111111-1111-4111-8111-111111111111%2Fedit"
  );
});

it("lets signed-in users create rules and owners edit their private rules", async () => {
  mockAuth.mockResolvedValue({ user: rule.creator });
  render(await NewCustomRulePage());
  expect(
    screen.getByRole("form", { name: "Custom rule editor" })
  ).toBeVisible();
  cleanup();

  mockFindCustomRule.mockResolvedValue({ ...rule, visibility: "private" });
  render(
    await EditCustomRulePage({ params: Promise.resolve({ id: rule.id }) })
  );
  expect(
    screen.getByRole("form", { name: "Custom rule editor" })
  ).toBeVisible();
});

it.each(["public", "private"])(
  "sends signed-in non-owners of %s rules to the reference, not an editor",
  async (visibility) => {
    mockAuth.mockResolvedValue({ user: { id: "someone-else" } });
    mockFindCustomRule.mockResolvedValue({ ...rule, visibility });
    await expect(
      EditCustomRulePage({ params: Promise.resolve({ id: rule.id }) })
    ).rejects.toThrow("REDIRECT:/rules");
  }
);

it("keeps invalid and missing rule edit URLs not found", async () => {
  mockAuth.mockResolvedValue({ user: rule.creator });
  await expect(
    EditCustomRulePage({ params: Promise.resolve({ id: "invalid" }) })
  ).rejects.toThrow("NOT_FOUND");
  mockFindCustomRule.mockResolvedValue(null);
  await expect(
    EditCustomRulePage({ params: Promise.resolve({ id: rule.id }) })
  ).rejects.toThrow("NOT_FOUND");
});
