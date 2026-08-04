import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdventureInput } from "@/lib/db/adventures";
import type { BestiaryEntryMini } from "@/lib/services/monsters";
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

const encounterMonster: BestiaryEntryMini = {
  id: "11111111-1111-4111-8111-111111111111",
  hazard: false,
  level: "2",
  levelInt: 2,
  name: "Giant Spider",
  visibility: "public",
  createdAt: new Date(),
  isOfficial: true,
  hp: 30,
  legendary: false,
  minion: false,
  size: "large",
  armor: "medium",
};

const encounter: EncounterOverview = {
  id: "22222222-2222-4222-8222-222222222222",
  creator,
  name: "Spider Lair",
  visibility: "public",
  heroCount: 4,
  heroLevel: 2,
  monsters: [
    {
      monster: encounterMonster,
      quantity: 1,
      isPerHero: false,
    },
  ],
};

const encounterValue: AdventureInput = {
  ...initialValue,
  nodes: [
    {
      ...initialValue.nodes[0],
      kind: "encounter",
      title: "",
      content: "",
      encounterId: encounter.id,
    },
  ],
};

const calloutValue: AdventureInput = {
  ...initialValue,
  nodes: [
    {
      ...initialValue.nodes[0],
      kind: "callout",
      title: "A Callout",
      content: "Callout content",
      presentation: "note",
    },
  ],
};

function renderForm(
  value: AdventureInput = initialValue,
  encounters: EncounterOverview[] = []
) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AdventureForm
        initialValue={value}
        encounters={encounters}
        creator={creator}
      />
    </QueryClientProvider>
  );
}

describe("AdventureForm", () => {
  it("styles adventure details like the rendered adventure header", () => {
    renderForm();

    expect(screen.queryByText("Adventure details")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveClass(
      "text-center",
      "font-slab",
      "text-4xl",
      "font-bold"
    );
    expect(screen.getByLabelText("Tagline")).toHaveClass(
      "text-center",
      "text-lg",
      "italic"
    );
    expect(screen.getByLabelText("Summary")).toHaveClass(
      "text-lg",
      "leading-relaxed"
    );
    expect(screen.getByText("Test Author")).toBeVisible();
  });

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

  it("renders the accessible colored callout presentation pills", () => {
    renderForm(calloutValue);

    const group = screen.getByRole("group", { name: "Callout style" });
    expect(
      within(group)
        .getAllByRole("radio")
        .map((button) => button.textContent)
    ).toEqual(["Note", "Read Aloud", "Warning", "GM Tip", "Optional"]);
    expect(within(group).getByRole("radio", { name: "Note" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(
      within(group).getByRole("radio", { name: "GM Tip" })
    ).toHaveAttribute("aria-checked", "false");

    fireEvent.click(within(group).getByRole("radio", { name: "GM Tip" }));

    expect(
      within(group).getByRole("radio", { name: "GM Tip" })
    ).toHaveAttribute("aria-checked", "true");
    expect(within(group).getByRole("radio", { name: "Note" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("falls back to Note when editing a legacy rules callout", () => {
    renderForm({
      ...calloutValue,
      nodes: [{ ...calloutValue.nodes[0], presentation: "rules" }],
    });

    const group = screen.getByRole("group", { name: "Callout style" });
    expect(within(group).getByRole("radio", { name: "Note" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(
      within(group).getByRole("radio", { name: "GM Tip" })
    ).toHaveAttribute("aria-checked", "false");
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

  it("renders the selected encounter's monster minis beneath its selector", () => {
    renderForm(encounterValue, [encounter]);

    expect(screen.getByRole("link", { name: "Giant Spider" })).toBeVisible();
  });

  it("removes monster minis when the encounter selection is cleared", async () => {
    renderForm(encounterValue, [encounter]);

    fireEvent.click(screen.getByRole("combobox", { name: "Encounter" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "Select an encounter" })
    );

    expect(
      screen.queryByRole("link", { name: "Giant Spider" })
    ).not.toBeInTheDocument();
  });
});
