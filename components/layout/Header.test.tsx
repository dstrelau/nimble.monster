import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getNavCountsAction } from "@/app/actions/nav";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import Header, { type AllNavCounts } from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/app/actions/nav", () => ({
  getNavCountsAction: vi.fn(),
}));

vi.mock("@/components/layout/UserNavItem", () => ({
  UserNavItem: () => null,
}));

const counts: AllNavCounts = {
  monsters: 2772,
  hazards: 12,
  companions: 116,
  ancestries: 124,
  backgrounds: 45,
  classes: 33,
  subclasses: 247,
  spellSchools: 63,
  items: 949,
  adventures: 1,
  encounters: 28,
  rules: 137,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Header", () => {
  it("renders mobile navigation counts from server-provided initial data", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <Header initialCounts={counts} />
      </QueryClientProvider>
    );

    const mobileMenuButton = container.querySelector("nav button");
    expect(mobileMenuButton).not.toBeNull();
    if (!mobileMenuButton) return;
    fireEvent.click(mobileMenuButton);

    expect(
      screen.getByRole("link", { name: "Monsters 2772" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Adventures 1" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Encounters 28" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rules 137" })).toHaveAttribute(
      "href",
      "/rules"
    );
    expect(screen.getByRole("link", { name: "Dice Roller" })).toHaveAttribute(
      "href",
      "/roll"
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.queryByText("Random Tables")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create" })
    ).not.toBeInTheDocument();
    expect(getNavCountsAction).not.toHaveBeenCalled();
  });

  it("shows random tables only when its feature is enabled", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <FeatureFlagsProvider enabledFeatures={["random-tables"]}>
        <QueryClientProvider client={queryClient}>
          <Header initialCounts={counts} />
        </QueryClientProvider>
      </FeatureFlagsProvider>
    );

    const mobileMenuButton = container.querySelector("nav button");
    expect(mobileMenuButton).not.toBeNull();
    if (!mobileMenuButton) return;
    fireEvent.click(mobileMenuButton);

    expect(screen.getByRole("link", { name: "Random Tables" })).toHaveAttribute(
      "href",
      "/random-tables"
    );
  });
});
