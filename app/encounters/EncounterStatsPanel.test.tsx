import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { EncounterOverview } from "@/lib/types";
import { EncounterStatsPanel } from "./EncounterStatsPanel";

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
