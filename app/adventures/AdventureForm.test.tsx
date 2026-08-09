import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdventureInput, AdventureStatblock } from "@/lib/db/adventures";
import type { Item } from "@/lib/services/items";
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
vi.mock("@/components/encounter/EncounterCard", () => ({
  EncounterCard: ({
    encounter,
    limit,
  }: {
    encounter: { name: string };
    limit?: number;
  }) => (
    <div>
      Condensed encounter: {encounter.name} (limit {limit})
    </div>
  ),
}));
vi.mock("@/app/collections/SelectableItemGrid", () => ({
  SelectableItemGrid: () => <div data-testid="item-grid" />,
}));
vi.mock("@/components/monster/SelectableMonsterGrid", () => ({
  SelectableMonsterGrid: () => <div data-testid="monster-grid" />,
}));
vi.mock("@/components/item/Card", () => ({
  Card: ({
    item,
    hideActions,
    link,
  }: {
    item: { name: string };
    hideActions?: boolean;
    link?: boolean;
  }) => (
    <div data-hide-actions={hideActions} data-link={link}>
      Selected item statblock: {item.name}
    </div>
  ),
}));
vi.mock("@/components/monster/Card", () => ({
  Card: ({
    monster,
    hideActions,
    link,
  }: {
    monster: { name: string };
    hideActions?: boolean;
    link?: boolean;
  }) => (
    <div data-hide-actions={hideActions} data-link={link}>
      Selected monster statblock: {monster.name}
    </div>
  ),
}));
vi.mock("./AdventureView", () => ({
  ADVENTURE_SECTION_MARKER_COLORS: [
    "text-orange-700 dark:text-orange-400",
    "text-cyan-700 dark:text-cyan-400",
    "text-emerald-700 dark:text-emerald-400",
    "text-violet-700 dark:text-violet-400",
  ],
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

const item: Item = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Honey Wand",
  rarity: "uncommon",
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  description: "A particularly sweet wand.",
  creator,
};

const itemStatblockValue: AdventureInput = {
  ...initialValue,
  nodes: [
    {
      ...initialValue.nodes[0],
      kind: "statblock",
      title: "",
      content: "",
      itemId: item.id,
    },
  ],
};

function renderForm(
  value: AdventureInput = initialValue,
  encounters: EncounterOverview[] = [],
  initialStatblocks: AdventureStatblock[] = []
) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AdventureForm
        initialValue={value}
        encounters={encounters}
        creator={creator}
        initialStatblocks={initialStatblocks}
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
      "text-3xl",
      "md:text-4xl",
      "font-bold"
    );
    expect(screen.getByLabelText("Tagline")).toHaveClass(
      "text-center",
      "text-base",
      "italic"
    );
    expect(
      screen.getByLabelText("Summary (shown in lists and link previews)")
    ).toHaveClass("min-h-16", "md:text-sm");
    expect(screen.getByText("Test Author")).toBeVisible();
    expect(screen.getByTestId("adventure-form-header-rule")).toHaveClass(
      "border-t-4",
      "border-foreground/70",
      "pt-1"
    );
    expect(screen.getByText("Adventure content")).toHaveClass(
      "font-slab",
      "text-xl"
    );
  });

  it("mirrors the rendered section markers and nested hierarchy", () => {
    const nestedValue: AdventureInput = {
      ...initialValue,
      nodes: [
        initialValue.nodes[0],
        {
          ...initialValue.nodes[1],
          id: "nested-section",
          parentId: initialValue.nodes[0].id,
          orderIndex: 0,
          title: "Nested section",
        },
        {
          ...initialValue.nodes[2],
          id: "deep-section",
          parentId: "nested-section",
          orderIndex: 0,
          title: "Deep section",
        },
      ],
    };

    const { container } = renderForm(nestedValue);

    const markers = screen.getAllByTestId("adventure-form-section-marker");
    expect(markers.map((marker) => marker.textContent)).toEqual(["01"]);
    expect(markers[0].firstElementChild).toHaveClass(
      "text-orange-700",
      "dark:text-orange-400"
    );
    expect(screen.getByDisplayValue("Section 1")).toHaveClass("h-9");
    expect(screen.getAllByLabelText("section content")[0]).toHaveClass(
      "min-h-16",
      "md:text-sm"
    );
    expect(screen.getByDisplayValue("Nested section")).toHaveClass("h-9");
    expect(
      container.querySelector("#adventure-node-nested-section")
    ).toHaveClass("border-l-4", "pl-4", "sm:pl-6");
    expect(container.querySelector("#adventure-node-deep-section")).toHaveClass(
      "border-l-2",
      "pl-3",
      "sm:pl-5"
    );
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
    expect(within(group).getByRole("radio", { name: "Note" })).toHaveClass(
      "h-8",
      "gap-1.5",
      "px-2.5",
      "text-xs",
      "hover:text-[#755f3d]",
      "dark:hover:text-[#e1cc9e]"
    );
    expect(screen.getByLabelText("callout content")).toHaveClass(
      "min-h-16",
      "md:text-sm"
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

  it("renders a condensed selected encounter beneath its selector", () => {
    renderForm(encounterValue, [encounter]);

    expect(
      screen.getByText("Condensed encounter: Spider Lair (limit 3)")
    ).toBeVisible();
    expect(
      screen.getByText("Condensed encounter: Spider Lair (limit 3)")
        .parentElement
    ).toHaveClass(
      "mx-auto",
      "md:w-[calc(50%-0.75rem)]",
      "lg:w-[calc(33.333333%-1rem)]"
    );
  });

  it("removes the encounter card when the selection is cleared", async () => {
    renderForm(encounterValue, [encounter]);

    fireEvent.click(screen.getByRole("combobox", { name: "Encounter" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "Select an encounter" })
    );

    expect(
      screen.queryByText("Condensed encounter: Spider Lair (limit 3)")
    ).not.toBeInTheDocument();
  });

  it("renders the statblock picker inline when no statblock is selected", () => {
    renderForm({
      ...itemStatblockValue,
      nodes: [{ ...itemStatblockValue.nodes[0], itemId: null }],
    });

    expect(screen.getByTestId("monster-grid")).toBeVisible();
    expect(screen.getByRole("tab", { name: "Items" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the selected statblock above the inline picker", () => {
    renderForm(itemStatblockValue, [], [{ entityType: "item", entity: item }]);

    const card = screen.getByText("Selected item statblock: Honey Wand");
    const picker = screen.getByTestId("monster-grid");
    expect(card).toBeVisible();
    expect(card).toHaveAttribute("data-hide-actions", "true");
    expect(card).toHaveAttribute("data-link", "false");
    expect(picker).toBeVisible();
    expect(card.compareDocumentPosition(picker)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
