import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { call } from "@/lib/contract";
import type { AdventureInput, AdventureStatblock } from "@/lib/db/adventures";
import type { Item } from "@/lib/services/items";
import type { BestiaryEntryMini } from "@/lib/services/monsters";
import type { EncounterOverview, User } from "@/lib/types";
import { AdventureForm } from "./AdventureForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/contract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contract")>()),
  call: vi.fn(() => new Promise(() => undefined)),
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
  SelectableItemGrid: ({ onToggle }: { onToggle: (item: Item) => void }) => (
    <div data-testid="item-grid">
      <button
        type="button"
        onClick={() =>
          onToggle({
            id: "44444444-4444-4444-8444-444444444444",
            name: "Picker Item",
            rarity: "common",
            visibility: "public",
            createdAt: new Date(),
            updatedAt: new Date(),
            description: "",
            creator: {
              id: "picker-creator",
              discordId: "picker-discord",
              username: "picker",
              displayName: "Picker",
            },
          })
        }
      >
        Select picker item
      </button>
    </div>
  ),
}));
vi.mock("@/components/monster/SelectableMonsterGrid", () => ({
  SelectableMonsterGrid: () => <div data-testid="monster-grid" />,
}));
vi.mock("@/components/item/Card", () => ({
  Card: ({
    item,
    hideActions,
    link,
    noInteractive,
  }: {
    item: { name: string };
    hideActions?: boolean;
    link?: boolean;
    noInteractive?: boolean;
  }) => (
    <div
      data-hide-actions={hideActions}
      data-link={link}
      data-no-interactive={noInteractive}
    >
      Selected item statblock: {item.name}
    </div>
  ),
}));
vi.mock("@/components/monster/Card", () => ({
  Card: ({
    monster,
    hideActions,
    link,
    noInteractive,
  }: {
    monster: { name: string };
    hideActions?: boolean;
    link?: boolean;
    noInteractive?: boolean;
  }) => (
    <div
      data-hide-actions={hideActions}
      data-link={link}
      data-no-interactive={noInteractive}
    >
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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
    monsterIds: [],
    itemIds: [],
    missingStatblockCount: 0,
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
      kind: "items",
      title: "",
      content: "",
      itemIds: [item.id],
    },
  ],
};

const imageValue: AdventureInput = {
  ...initialValue,
  nodes: [
    {
      ...initialValue.nodes[0],
      kind: "image",
      title: "",
      content: "",
      imageId: null,
      imageExtension: null,
      caption: "",
    },
  ],
};

const uploadedImageValue: AdventureInput = {
  ...imageValue,
  nodes: [
    {
      ...imageValue.nodes[0],
      imageId: "11111111-1111-4111-8111-111111111111",
      imageExtension: "png",
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
  it("defaults top-level nodes to sections and child nodes to text", () => {
    renderForm({ ...initialValue, nodes: [] });

    fireEvent.click(screen.getByRole("button", { name: "Add section" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.getByRole("combobox")).toHaveTextContent("Section");

    fireEvent.click(screen.getByRole("button", { name: "Add child" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(
      screen
        .getAllByRole("combobox")
        .some((combobox) => combobox.textContent?.includes("Text"))
    ).toBe(true);
  });

  it("copies bundled images into the user's account when loading an example", async () => {
    const imageId = "55555555-5555-4555-8555-555555555555";
    vi.mocked(call).mockClear();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["map"], { type: "image/jpeg" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: imageId, extension: "jpg" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AdventureForm
          initialValue={initialValue}
          encounters={[]}
          creator={creator}
          exampleAdventures={{
            sample: { ...imageValue, name: "Sample Adventure" },
          }}
          exampleAdventureImages={{
            sample: [
              {
                nodeId: imageValue.nodes[0].id,
                path: "/images/adventures/sample-map.jpg",
              },
            ],
          }}
        />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Sample" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/images/adventures/sample-map.jpg"
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/_actions/uploadAdventureImage",
      expect.objectContaining({ method: "POST" })
    );
    expect(
      await screen.findByAltText("Uploaded adventure map preview")
    ).toHaveAttribute(
      "src",
      `/blob-storage/adventure-images/${creator.id}/${imageId}/thumbnail-480.webp`
    );

    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(call).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: "Sample Adventure",
          nodes: [
            expect.objectContaining({
              kind: "image",
              imageId,
              imageExtension: "jpg",
            }),
          ],
        })
      )
    );
  });

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

  it("renders the preview without a card-style wrapper", () => {
    renderForm();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Toggle preview" })[0]
    );

    expect(
      screen.getByTestId("adventure-preview").parentElement
    ).not.toHaveClass(
      "max-w-5xl",
      "rounded-xl",
      "border",
      "bg-card",
      "px-6",
      "py-10",
      "sm:px-10"
    );
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

  it("shows a drop target, file picker, and optional caption for images", () => {
    renderForm(imageValue);

    expect(
      screen.getByRole("group", { name: "Adventure image upload" })
    ).toHaveClass("border-dashed");
    expect(screen.getByRole("button", { name: "Choose file" })).toBeVisible();
    expect(screen.getByLabelText("Choose adventure image")).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp"
    );
    expect(screen.getByLabelText("Caption (optional)")).toBeVisible();
    expect(screen.queryByLabelText("image content")).not.toBeInTheDocument();
  });

  it("requests safe cleanup when an uploaded image is removed", () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    renderForm(uploadedImageValue);

    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/_actions/adventureImage/11111111-1111-4111-8111-111111111111",
      { method: "DELETE" }
    );
    expect(
      screen.getByRole("group", { name: "Adventure image upload" })
    ).toBeVisible();
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

  it("opens the item picker from the add tile", () => {
    renderForm({
      ...itemStatblockValue,
      nodes: [{ ...itemStatblockValue.nodes[0], itemIds: [] }],
    });

    expect(screen.queryByTestId("item-grid")).not.toBeInTheDocument();
    const addButton = screen.getByRole("button", { name: "Add item" });
    expect(addButton.parentElement).toHaveClass("grid", "md:grid-cols-3");
    fireEvent.click(addButton);
    expect(screen.getByTestId("item-grid")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add item" })
    ).not.toBeInTheDocument();
  });

  it("adds a selected item once and closes the picker", () => {
    renderForm(itemStatblockValue, [], [{ entityType: "item", entity: item }]);

    const card = screen.getByText("Selected item statblock: Honey Wand");
    expect(card).toBeVisible();
    expect(card).toHaveAttribute("data-hide-actions", "true");
    expect(card).toHaveAttribute("data-link", "false");
    expect(card).toHaveAttribute("data-no-interactive", "true");
    const addButton = screen.getByRole("button", { name: "Add item" });
    expect(card.compareDocumentPosition(addButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    fireEvent.click(addButton);
    fireEvent.click(screen.getByRole("button", { name: "Select picker item" }));

    expect(
      screen.getByText("Selected item statblock: Picker Item")
    ).toBeVisible();
    expect(screen.queryByTestId("item-grid")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add item" })).toBeVisible();
  });

  it("preserves an item group title in the submitted payload", async () => {
    renderForm(itemStatblockValue, [], [{ entityType: "item", entity: item }]);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Titled Adventure" },
    });
    fireEvent.change(screen.getByLabelText("Title (optional)"), {
      target: { value: "Treasure Cache" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(call).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nodes: [expect.objectContaining({ title: "Treasure Cache" })],
        })
      )
    );
  });
});
