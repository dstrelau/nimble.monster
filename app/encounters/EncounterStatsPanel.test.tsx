import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Encounter, EncounterOverview } from "@/lib/types";
import { EncounterStatsPanel } from "./EncounterStatsPanel";
import { EncounterViewerSidebar } from "./EncounterViewerSidebar";

afterEach(cleanup);

const creator = {
  id: "user-1",
  discordId: "discord-1",
  username: "tester",
  displayName: "Tester",
};

const combatant = {
  id: "combatant",
  hp: 99,
  hpPerHero: 4,
  legendary: false,
  minion: false,
  level: "2",
  levelInt: 2,
  name: "Combatant",
  size: "medium" as const,
  armor: "none" as const,
  visibility: "public" as const,
  createdAt: new Date(0),
  hazard: false,
};

const hazard = {
  ...combatant,
  id: "hazard",
  hp: 1000,
  hpPerHero: null,
  level: "20",
  levelInt: 20,
  name: "Hazard",
  hazard: true,
};

const viewerEncounter: Encounter = {
  id: "encounter-1",
  creator,
  name: "Viewer encounter",
  visibility: "public",
  heroCount: 4,
  heroLevel: 2,
  monsters: [
    {
      quantity: 4,
      isPerHero: false,
      monster: {
        ...combatant,
        hazard: false,
        creator,
        updatedAt: new Date(0),
        abilities: [],
        actions: [],
        actionPreface: "",
        families: [],
        speed: 6,
        fly: 0,
        swim: 0,
        climb: 0,
        teleport: 0,
        burrow: 0,
      },
    },
  ],
};

describe("EncounterStatsPanel", () => {
  it("does not apply a monster-to-hero ratio to a legendary encounter", () => {
    const encounter: EncounterOverview = {
      id: "encounter-1",
      creator,
      name: "Legendary encounter",
      visibility: "public",
      heroCount: 4,
      heroLevel: 5,
      monsters: [
        {
          monster: {
            ...combatant,
            hp: 0,
            hpPerHero: 35,
            legendary: true,
            level: "5",
            levelInt: 5,
            name: "Legendary Monster",
          },
          quantity: 1,
          isPerHero: false,
        },
      ],
    };

    render(<EncounterStatsPanel encounter={encounter} />);

    expect(
      screen.getByText("Monsters per Hero").nextElementSibling
    ).toHaveTextContent("N/A");
    expect(
      screen.queryByText(
        "This monster:hero ratio is not recommended — use a legendary monster instead."
      )
    ).not.toBeInTheDocument();
    expect(screen.getByText("Difficulty").nextElementSibling).toHaveTextContent(
      "Hard"
    );
  });

  it("excludes hazards and resolves per-hero HP for combatants", () => {
    const encounter: EncounterOverview = {
      id: "encounter-1",
      creator,
      name: "Hazardous encounter",
      visibility: "public",
      heroCount: 3,
      heroLevel: 5,
      monsters: [
        { monster: combatant, quantity: 2, isPerHero: false },
        { monster: hazard, quantity: 5, isPerHero: true },
      ],
    };

    render(<EncounterStatsPanel encounter={encounter} />);

    const countLabels = screen.getAllByText("Count");
    expect(countLabels[0].nextElementSibling).toHaveTextContent("3");
    expect(countLabels[1].nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Total HP").nextElementSibling).toHaveTextContent(
      "24"
    );
    expect(
      screen.getByText("Monsters per Hero").nextElementSibling
    ).toHaveTextContent("0.7:1");
    expect(screen.getByText("Difficulty").nextElementSibling).toHaveTextContent(
      "Easy"
    );
  });
});

describe("EncounterViewerSidebar", () => {
  it("recalculates for a viewer's party and resets without changing the saved encounter", () => {
    const { unmount } = render(
      <EncounterViewerSidebar encounter={viewerEncounter} />
    );
    const difficulty = screen.getByText("Difficulty").nextElementSibling;
    expect(difficulty).toHaveTextContent("Hard");

    fireEvent.change(screen.getByRole("spinbutton", { name: "Hero count" }), {
      target: { value: "6" },
    });
    expect(difficulty).toHaveTextContent("Medium");
    expect(
      screen.getByText("Monsters per Hero").nextElementSibling
    ).toHaveTextContent("0.7:1");
    expect(screen.getByText("Total HP").nextElementSibling).toHaveTextContent(
      "96"
    );

    fireEvent.change(screen.getByRole("spinbutton", { name: "Hero level" }), {
      target: { value: "4" },
    });
    expect(difficulty).toHaveTextContent("Easy");
    expect(
      screen.getAllByText("Total Levels")[0].nextElementSibling
    ).toHaveTextContent("24");
    expect(viewerEncounter.heroCount).toBe(4);
    expect(viewerEncounter.heroLevel).toBe(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Reset heroes to encounter defaults" })
    );
    expect(screen.getByRole("spinbutton", { name: "Hero count" })).toHaveValue(
      4
    );
    expect(screen.getByRole("spinbutton", { name: "Hero level" })).toHaveValue(
      2
    );
    expect(difficulty).toHaveTextContent("Hard");

    fireEvent.change(screen.getByRole("spinbutton", { name: "Hero count" }), {
      target: { value: "7" },
    });
    unmount();
    render(<EncounterViewerSidebar encounter={viewerEncounter} />);
    expect(screen.getByRole("spinbutton", { name: "Hero count" })).toHaveValue(
      4
    );
  });

  it("uses the adjusted count for per-hero quantities and combat tracker HP", () => {
    const encounter: Encounter = {
      ...viewerEncounter,
      monsters: viewerEncounter.monsters.map((entry) => ({
        ...entry,
        quantity: 1,
        isPerHero: true,
        heroesPerMonster: 2,
      })),
    };
    render(<EncounterViewerSidebar encounter={encounter} />);
    fireEvent.click(screen.getByRole("button", { name: "Combat Tracker" }));
    expect(screen.getAllByRole("button", { name: "Mark 16 HP" })).toHaveLength(
      2
    );

    fireEvent.change(screen.getByRole("spinbutton", { name: "Hero count" }), {
      target: { value: "6" },
    });
    expect(
      screen.getAllByText("Count")[1].nextElementSibling
    ).toHaveTextContent("3");
    expect(screen.getByText("Total HP").nextElementSibling).toHaveTextContent(
      "72"
    );
    expect(screen.getAllByRole("button", { name: "Mark 24 HP" })).toHaveLength(
      3
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Reset heroes to encounter defaults" })
    );
    expect(screen.getAllByRole("button", { name: "Mark 16 HP" })).toHaveLength(
      2
    );
    expect(
      screen.queryByRole("button", { name: "Mark 24 HP" })
    ).not.toBeInTheDocument();
  });
});
