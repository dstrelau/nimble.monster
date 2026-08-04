import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdventureInput } from "@/lib/db/adventures";
import type { EncounterOverview, User } from "@/lib/types";
import { AdventureForm } from "./AdventureForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => (
    <button type="button" data-testid="formatting-trigger">
      Formatting help
    </button>
  ),
}));
vi.mock("@/app/collections/SelectableItemGrid", () => ({
  SelectableItemGrid: () => <div data-testid="item-grid" />,
}));
vi.mock("@/components/monster/SelectableMonsterGrid", () => ({
  SelectableMonsterGrid: () => <div data-testid="monster-grid" />,
}));
vi.mock("./AdventureView", () => ({
  AdventureView: () => <div data-testid="adventure-preview" />,
}));

afterEach(cleanup);

const creator: User = {
  id: "creator",
  discordId: "creator-discord",
  username: "test-author",
  displayName: "Test Author",
};

const initialValue: AdventureInput = {
  name: "",
  tagline: "",
  summary: "",
  visibility: "public",
  nodes: [0, 1, 2, 3, 4].map((orderIndex) => ({
    id: `section-${orderIndex}`,
    parentId: null,
    kind: "section",
    orderIndex,
    title: `Section ${orderIndex + 1}`,
    content: "",
    encounterId: null,
    monsterId: null,
    itemId: null,
    presentation: null,
  })),
};

function renderForm() {
  const queryClient = new QueryClient();
  const encounters: EncounterOverview[] = [];
  return render(
    <QueryClientProvider client={queryClient}>
      <AdventureForm
        initialValue={initialValue}
        encounters={encounters}
        creator={creator}
      />
    </QueryClientProvider>
  );
}

describe("AdventureForm", () => {
  it("keeps the desktop preview toggle and outline together in a sticky sidebar", () => {
    renderForm();

    const toggles = screen.getAllByRole("button", { name: "Toggle preview" });
    expect(toggles).toHaveLength(2);
    expect(toggles[0]).toHaveClass("lg:hidden");

    const outline = screen.getByRole("navigation", {
      name: "Adventure outline",
    });
    const stickySidebar = toggles[1].parentElement;
    expect(stickySidebar).toHaveClass("sticky");
    expect(stickySidebar).toContainElement(outline);
    expect(outline).not.toHaveClass("sticky");
  });

  it("uses one formatting help trigger and accessible content textareas", () => {
    renderForm();

    expect(
      screen.getByText("Most text boxes support site formatting")
    ).toBeVisible();
    expect(screen.getAllByTestId("formatting-trigger")).toHaveLength(1);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("section content")).toHaveLength(5);
  });
});
