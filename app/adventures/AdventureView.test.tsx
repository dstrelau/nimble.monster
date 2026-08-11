import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Adventure } from "@/lib/db/adventures";
import type { AdventureNodePresentation } from "@/lib/db/schema";
import { AdventureView } from "./AdventureView";
import {
  EXAMPLE_ADVENTURE_IMAGES,
  getExampleAdventures,
} from "./exampleAdventures";

const { mockUseConditions } = vi.hoisted(() => ({
  mockUseConditions: vi.fn(),
}));

vi.mock("@/components/item/Card", () => ({
  Card: ({
    item,
    noInteractive,
  }: {
    item: { name: string };
    noInteractive?: boolean;
  }) => (
    <div data-no-interactive={noInteractive}>Item statblock: {item.name}</div>
  ),
}));
vi.mock("@/components/monster/Card", () => ({
  Card: ({
    monster,
    noInteractive,
  }: {
    monster: { name: string };
    noInteractive?: boolean;
  }) => (
    <div data-no-interactive={noInteractive}>
      Monster statblock: {monster.name}
    </div>
  ),
}));
vi.mock("@/components/encounter/EncounterCard", () => ({
  EncounterCard: ({ encounter }: { encounter: { name: string } }) => (
    <div>Encounter card: {encounter.name}</div>
  ),
}));
vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: mockUseConditions,
}));

const officialBlinded = {
  id: "official-blinded",
  name: "Blinded",
  description: "You cannot see.",
  official: true,
};

const calloutVariants: Array<{
  presentation: Exclude<AdventureNodePresentation, "rules">;
  label: string;
  iconClass: string;
  panelClass: string;
}> = [
  {
    presentation: "note",
    label: "Note",
    iconClass: "lucide-info",
    panelClass: "bg-[#f8f1e4]",
  },
  {
    presentation: "read-aloud",
    label: "Read Aloud",
    iconClass: "lucide-book-open",
    panelClass: "bg-[#edf5f6]",
  },
  {
    presentation: "warning",
    label: "Warning",
    iconClass: "lucide-triangle-alert",
    panelClass: "bg-[#fff0eb]",
  },
  {
    presentation: "tip",
    label: "GM Tip",
    iconClass: "lucide-lightbulb",
    panelClass: "bg-[#f2f7ed]",
  },
  {
    presentation: "optional",
    label: "Optional",
    iconClass: "lucide-bookmark",
    panelClass: "bg-[#f6f0fe]",
  },
];

function calloutAdventure(
  presentation: AdventureNodePresentation,
  title = "A Callout Title"
): Pick<Adventure, "name" | "tagline" | "summary" | "creator" | "nodes"> {
  return {
    name: "Callout Test",
    tagline: "",
    summary: "",
    creator: {
      id: "creator",
      discordId: "creator-discord",
      username: "test-author",
      displayName: "Test Author",
    },
    nodes: [
      {
        id: "callout",
        parentId: null,
        kind: "callout",
        orderIndex: 0,
        title,
        content: "Callout body.",
        encounter: null,
        monsters: [],
        items: [],
        missingStatblockCount: 0,
        referenceRemoved: false,
        presentation,
      },
    ],
  };
}

beforeEach(() => {
  mockUseConditions.mockReturnValue({
    allConditions: [officialBlinded],
    isLoading: false,
  });
});

afterEach(() => {
  cleanup();
  mockUseConditions.mockReset();
});

describe("AdventureView", () => {
  it.each(
    calloutVariants
  )("renders the $label callout with its shared icon and color treatment", ({
    presentation,
    label,
    iconClass,
    panelClass,
  }) => {
    render(<AdventureView adventure={calloutAdventure(presentation)} />);

    const panel = screen.getByTestId("adventure-callout");
    expect(panel).toHaveAttribute("data-callout-presentation", presentation);
    expect(panel).toHaveClass("border-l-4", panelClass);
    expect(screen.getByText("A Callout Title")).toHaveClass("text-xs");
    expect(screen.queryByText(label)).not.toBeInTheDocument();
    expect(panel.querySelector(`svg.${iconClass}`)).not.toBeNull();
    expect(panel).toHaveClass("my-2");
    const icon = panel.querySelector(`svg.${iconClass}`);
    expect(icon).toHaveClass("size-3.5");
    expect(icon?.parentElement).toHaveClass("size-6", "rounded-md");
    expect(
      screen.queryByRole("heading", { name: "A Callout Title" })
    ).not.toBeInTheDocument();
    expect(panel.querySelector("div.text-sm")).toHaveClass(
      "text-sm",
      "leading-5"
    );
  });

  it("displays the callout style when the callout has no title", () => {
    render(<AdventureView adventure={calloutAdventure("note", "")} />);

    expect(screen.getByText("Note")).toBeVisible();
  });

  it("normalizes legacy rules callouts to a selected note presentation", () => {
    render(<AdventureView adventure={calloutAdventure("rules", "")} />);

    const panel = screen.getByTestId("adventure-callout");
    expect(panel).toHaveAttribute("data-callout-presentation", "note");
    expect(screen.getByText("Note")).toBeVisible();
    expect(panel.querySelector("svg.lucide-info")).not.toBeNull();
  });

  it("renders ordered nested content, callouts, and encounter cards", () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "A Perilous Test",
      tagline: "Mind the fixtures",
      summary: "A short test adventure.",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "root",
          parentId: null,
          kind: "section",
          orderIndex: 0,
          title: "First Stop",
          content: "",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "introduction",
          parentId: "root",
          kind: "text",
          orderIndex: 0,
          title: "",
          content: "Welcome, **heroes**.",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "warning",
          parentId: "root",
          kind: "callout",
          orderIndex: 1,
          title: "Watch Out",
          content: "The floor is trapped.",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: "warning",
        },
        {
          id: "fight",
          parentId: "root",
          kind: "encounter",
          orderIndex: 2,
          title: "",
          content: "The monsters defend their den.",
          encounter: {
            id: "00000000-0000-0000-0000-000000000001",
            name: "Den Defenders",
            description: "Defenders of the den.",
            visibility: "public",
            heroCount: 4,
            heroLevel: 1,
            creator: {
              id: "creator",
              discordId: "creator-discord",
              username: "test-author",
              displayName: "Test Author",
            },
            monsters: [],
          },
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "treasure",
          parentId: "root",
          kind: "items",
          orderIndex: 3,
          title: "Reward",
          content: "The heroes find this item.",
          encounter: null,
          monsters: [],
          items: [
            {
              id: "00000000-0000-0000-0000-000000000002",
              name: "Honey Wand",
              description: "A very sticky wand.",
              rarity: "uncommon",
              visibility: "public",
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: {
                id: "creator",
                discordId: "creator-discord",
                username: "test-author",
                displayName: "Test Author",
              },
            },
          ],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "removed",
          parentId: "root",
          kind: "encounter",
          orderIndex: 4,
          title: "Lost encounter",
          content: "",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: true,
          presentation: null,
        },
        {
          id: "second-root",
          parentId: null,
          kind: "section",
          orderIndex: 1,
          title: "Second Stop",
          content: "The journey continues.",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
      ],
    };

    const { container } = render(<AdventureView adventure={adventure} />);

    const title = screen.getByRole("heading", { name: "A Perilous Test" });
    expect(title).toBeVisible();
    expect(title).toHaveClass("font-slab", "text-3xl", "sm:text-4xl");
    expect(
      screen.queryByText("A short test adventure.")
    ).not.toBeInTheDocument();
    const headerRule = screen.getByTestId("adventure-header-rule");
    expect(headerRule).toHaveClass(
      "border-t-4",
      "border-foreground/70",
      "pt-1"
    );
    expect(headerRule.firstElementChild).toHaveClass(
      "h-px",
      "bg-border-strong"
    );
    expect(screen.getByRole("heading", { name: "First Stop" })).toHaveClass(
      "text-2xl",
      "sm:text-3xl"
    );
    expect(
      screen.getByRole("link", { name: "Link to First Stop" })
    ).toHaveAttribute("href", "#adventure-node-root");
    expect(
      screen.getByRole("link", { name: "Link to First Stop" })
    ).toHaveClass("opacity-0", "group-hover:opacity-100");
    expect(screen.getByText("Watch Out")).toHaveClass("text-xs");
    expect(
      screen.queryByRole("heading", { name: "Watch Out" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeVisible();
    expect(screen.getByText("heroes").tagName.toLowerCase()).toBe("strong");
    const encounterCard = screen.getByText("Encounter card: Den Defenders");
    expect(encounterCard).toBeVisible();
    expect(encounterCard.closest(".grid")).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "xl:grid-cols-3"
    );
    expect(
      screen.queryByText("The monsters defend their den.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Item statblock: Honey Wand")).toHaveAttribute(
      "data-no-interactive",
      "true"
    );
    expect(screen.getByText("Reward")).toBeVisible();
    expect(
      screen.queryByText("The heroes find this item.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Removed content")).toBeVisible();
    expect(container.querySelectorAll('[data-slot="separator"]')).toHaveLength(
      0
    );
    expect(screen.getAllByTestId("adventure-section-marker")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Second Stop" })).toHaveClass(
      "font-slab"
    );
  });

  it("numbers only top-level regular sections with integrated rules", () => {
    const adventure = calloutAdventure("note");
    adventure.nodes = [
      {
        ...adventure.nodes[0],
        id: "first-section",
        kind: "section",
        title: "First Section",
      },
      {
        ...adventure.nodes[0],
        id: "root-callout",
        kind: "callout",
        title: "A Note",
        presentation: "note",
        orderIndex: 1,
      },
      {
        ...adventure.nodes[0],
        id: "second-section",
        kind: "section",
        title: "Second Section",
        orderIndex: 2,
      },
      {
        ...adventure.nodes[0],
        id: "root-encounter",
        kind: "encounter",
        title: "",
        content: "",
        encounter: null,
        orderIndex: 3,
      },
      {
        ...adventure.nodes[0],
        id: "root-statblock",
        kind: "monsters",
        title: "",
        content: "",
        monsters: [],
        items: [],
        missingStatblockCount: 0,
        orderIndex: 4,
      },
    ];

    const { container } = render(<AdventureView adventure={adventure} />);

    const markers = screen.getAllByTestId("adventure-section-marker");
    expect(markers.map((marker) => marker.textContent)).toEqual(["01", "02"]);
    expect(screen.getAllByTestId("adventure-section-rule")).toHaveLength(2);
    expect(markers[0]).toHaveClass("flex", "items-center");
    expect(
      markers[0].querySelector("[data-testid=adventure-section-rule]")
    ).toHaveClass("flex-1");
    expect(container.querySelectorAll('[data-slot="separator"]')).toHaveLength(
      0
    );
    expect(screen.queryByText("A Note")).toBeVisible();
    expect(
      screen
        .getByTestId("adventure-callout")
        .querySelector('[data-testid="adventure-section-marker"]')
    ).toBeNull();
  });

  it("renders nested regular sections without rails or left insets", () => {
    const adventure = calloutAdventure("note");
    adventure.nodes = [
      {
        ...adventure.nodes[0],
        id: "top-section",
        kind: "section",
        title: "Top Section",
        content: "Top content",
      },
      {
        ...adventure.nodes[0],
        id: "nested-section",
        parentId: "top-section",
        kind: "section",
        title: "Nested Section",
        content: "Nested content",
      },
      {
        ...adventure.nodes[0],
        id: "deep-section",
        parentId: "nested-section",
        kind: "section",
        title: "Deep Section",
        content: "Deep content",
      },
    ];

    render(<AdventureView adventure={adventure} />);

    const nested = screen.getByRole("heading", {
      name: "Nested Section",
    }).parentElement;
    const deep = screen.getByRole("heading", {
      name: "Deep Section",
    }).parentElement;
    expect(nested).toHaveAttribute("data-adventure-section-depth", "1");
    expect(nested).not.toHaveClass(
      "border-l-4",
      "border-border-strong",
      "pl-4",
      "sm:pl-6"
    );
    expect(deep).toHaveAttribute("data-adventure-section-depth", "2");
    expect(deep).not.toHaveClass(
      "border-l-2",
      "border-border-strong/70",
      "pl-3",
      "sm:pl-5"
    );
    expect(screen.getByRole("heading", { name: "Nested Section" })).toHaveClass(
      "font-slab"
    );
  });

  it("cycles the four readable marker colors by top-level section index", () => {
    const adventure = calloutAdventure("note");
    const sections: Adventure["nodes"] = [];
    for (let index = 0; index < 5; index++) {
      sections.push({
        ...adventure.nodes[0],
        id: `section-${index}`,
        kind: "section",
        title: `Section ${index + 1}`,
        orderIndex: index,
      });
    }
    adventure.nodes = sections;

    render(<AdventureView adventure={adventure} />);

    const markerNumbers = screen.getAllByTestId(
      "adventure-section-marker-number"
    );
    expect(markerNumbers.map((marker) => marker.textContent)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
    expect(markerNumbers[0]).toHaveClass(
      "text-orange-700",
      "dark:text-orange-400"
    );
    expect(markerNumbers[1]).toHaveClass("text-cyan-700", "dark:text-cyan-400");
    expect(markerNumbers[2]).toHaveClass(
      "text-emerald-700",
      "dark:text-emerald-400"
    );
    expect(markerNumbers[3]).toHaveClass(
      "text-violet-700",
      "dark:text-violet-400"
    );
    expect(markerNumbers[4]).toHaveClass(
      "text-orange-700",
      "dark:text-orange-400"
    );
    expect(screen.getAllByTestId("adventure-section-rule")[0]).toHaveClass(
      "bg-border-strong"
    );
  });

  it("provides a valid loadable sample tree", () => {
    const sample = getExampleAdventures({
      goblinMinionId: "goblin-minion",
      goblinId: "goblin",
      bugbearId: "bugbear",
      skeletonId: "skeleton",
    })["delian tomb"];
    const ids = new Set(sample.nodes.map((node) => node.id));
    const nodesById = new Map(sample.nodes.map((node) => [node.id, node]));

    expect(sample.name).toBe("The Delian Tomb");
    expect(sample.nodes.length).toBeGreaterThan(10);
    expect(
      sample.nodes.every((node) => !node.parentId || ids.has(node.parentId))
    ).toBe(true);
    expect(
      sample.nodes.every(
        (node) => node.parentId !== null || node.kind === "section"
      )
    ).toBe(true);
    expect(
      sample.nodes.every(
        (node) => node.kind !== "section" || node.content === ""
      )
    ).toBe(true);
    expect(sample.nodes.some((node) => node.kind === "callout")).toBe(true);
    expect(sample.nodes.filter((node) => node.kind === "image")).toEqual([
      expect.objectContaining({
        id: "tomb-map",
        parentId: "locations",
        imageId: null,
      }),
    ]);
    expect(EXAMPLE_ADVENTURE_IMAGES["delian tomb"]).toEqual([
      {
        nodeId: "tomb-map",
        path: "/images/adventures/delian-tomb/map.jpg",
      },
    ]);
    expect(
      sample.nodes.every((node) => {
        if (!node.parentId) return true;
        return nodesById.get(node.parentId)?.kind === "section";
      })
    ).toBe(true);
    expect(
      sample.nodes.every((node) => {
        let depth = 0;
        let parentId = node.parentId;
        while (parentId) {
          depth += 1;
          parentId = nodesById.get(parentId)?.parentId ?? null;
        }
        return depth <= 2;
      })
    ).toBe(true);
    expect(
      sample.nodes.filter((node) => node.kind === "encounter")
    ).toHaveLength(0);
    const statblockNodes = sample.nodes.filter(
      (node) => node.kind === "monsters"
    );
    expect(statblockNodes).toHaveLength(4);
    expect(
      statblockNodes.map(({ parentId, monsterIds }) => ({
        parentId,
        monsterId: monsterIds[0],
      }))
    ).toEqual([
      { parentId: "following-trail", monsterId: "goblin-minion" },
      { parentId: "entrance", monsterId: "goblin" },
      { parentId: "ritual-chamber", monsterId: "bugbear" },
      { parentId: "hidden-crypt", monsterId: "skeleton" },
    ]);
  });

  it("omits an example statblock when its official monster is unavailable", () => {
    const sample = getExampleAdventures({ goblinId: "goblin" })["delian tomb"];

    expect(sample.nodes.filter((node) => node.kind === "monsters")).toEqual([
      expect.objectContaining({
        parentId: "entrance",
        monsterIds: ["goblin"],
      }),
    ]);
    expect(
      sample.nodes.some(
        (node) => node.parentId === "hidden-crypt" && node.kind === "monsters"
      )
    ).toBe(false);
  });

  it("passes official conditions to formatted adventure content", () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "Condition Test",
      tagline: "",
      summary: "",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "condition-section",
          parentId: null,
          kind: "section",
          orderIndex: 0,
          title: "Conditions",
          content: "",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "condition-node",
          parentId: "condition-section",
          kind: "text",
          orderIndex: 0,
          title: "Status",
          content: "The hero is [[Blinded]].",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
      ],
    };

    render(<AdventureView adventure={adventure} />);

    expect(screen.getByRole("heading", { name: "Status" })).toBeVisible();
    expect(screen.getByText("Blinded")).toHaveClass("cursor-default");
  });

  it("keeps content visible while conditions load and resolves it after ready", async () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "Loading Conditions",
      tagline: "",
      summary: "",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "loading-node",
          parentId: null,
          kind: "section",
          orderIndex: 0,
          title: "Loading Section",
          content: "",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
        {
          id: "loading-text",
          parentId: "loading-node",
          kind: "text",
          orderIndex: 0,
          title: "",
          content: "The hero is [[Blinded]].",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          referenceRemoved: false,
          presentation: null,
        },
      ],
    };
    mockUseConditions
      .mockReturnValueOnce({ allConditions: [], isLoading: true })
      .mockReturnValueOnce({
        allConditions: [officialBlinded],
        isLoading: false,
      });

    const { rerender } = render(<AdventureView adventure={adventure} />);

    expect(
      screen.getByRole("heading", { name: "Loading Section" })
    ).toBeVisible();
    expect(screen.getByText("Blinded")).toHaveClass("cursor-help");

    rerender(<AdventureView adventure={adventure} />);

    await waitFor(() => {
      expect(screen.getByText("Blinded")).toHaveClass("cursor-default");
    });
  });

  it("renders an image caption and opens the original in a lightbox", () => {
    const adventure: Pick<
      Adventure,
      "name" | "tagline" | "summary" | "creator" | "nodes"
    > = {
      name: "Mapped Adventure",
      tagline: "",
      summary: "",
      creator: {
        id: "creator",
        discordId: "creator-discord",
        username: "test-author",
        displayName: "Test Author",
      },
      nodes: [
        {
          id: "map",
          parentId: null,
          kind: "image",
          orderIndex: 0,
          title: "",
          content: "",
          encounter: null,
          monsters: [],
          items: [],
          missingStatblockCount: 0,
          image: {
            id: "image-id",
            extension: "png",
            originalUrl: "/original.png",
            thumbnailUrl: "/thumbnail.webp",
            displayUrl: "/display.webp",
          },
          caption: "Map of the haunted keep",
          referenceRemoved: false,
          presentation: null,
        },
      ],
    };

    render(<AdventureView adventure={adventure} />);

    const caption = screen.getByText("Map of the haunted keep");
    expect(caption.tagName.toLowerCase()).toBe("figcaption");
    expect(caption).toHaveClass("italic");
    const trigger = screen.getByRole("button", {
      name: "View full size: Map of the haunted keep",
    });
    expect(trigger).toHaveClass("max-w-full", "sm:max-w-[50%]");
    expect(trigger.querySelector("img")).toHaveAttribute(
      "src",
      "/display.webp"
    );

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog").querySelector("img")).toHaveAttribute(
      "src",
      "/original.png"
    );
  });
});
