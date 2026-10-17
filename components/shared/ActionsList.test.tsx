import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TROLL_HUNTER } from "@/app/dev/monster-card/fixtures";
import { AbilityOverlay } from "./AbilityOverlay";
import { ActionsList } from "./ActionsList";

afterEach(cleanup);

describe("ActionsList", () => {
  it("flows damage and effects in one paragraph after the action name", () => {
    render(
      <ActionsList
        actions={TROLL_HUNTER.actions}
        actionPreface={TROLL_HUNTER.actionPreface}
        conditions={[]}
      />
    );

    expect(screen.getByText("Choose one.")).toBeInTheDocument();
    const actions = screen.getAllByRole("listitem");
    expect(actions).toHaveLength(3);
    expect(within(actions[0]).getByText("Heavy Crossbow.")).toBeInTheDocument();
    const paragraph = actions[0].querySelector("p");
    expect(paragraph).toHaveTextContent(
      "(Range 2-12) D102d10+10 piercing. On damage: Prone."
    );
    expect(paragraph?.querySelector("[data-dice-notation]")).not.toBeNull();
    expect(actions[1]).toHaveTextContent("• Claw (2x).");
    expect(actions[1].querySelector("p")).toHaveTextContent("2d6+8 slashing.");
    expect(actions[2].querySelector("p")).toHaveTextContent(
      "D84d8+12 piercing."
    );
  });

  it("keeps description paragraphs and separates unterminated damage text", () => {
    render(
      <ActionsList
        actions={[
          {
            id: "single-action",
            name: "Strike",
            damage: "2d6+3",
            description: "Push the target.\n\n**On a crit:** push it again.",
          },
        ]}
        conditions={[]}
      />
    );

    const action = screen.getByRole("listitem");
    expect(action).not.toHaveTextContent("•");
    expect(action.querySelectorAll("p")).toHaveLength(2);
    expect(action.querySelector("p")).toHaveTextContent(
      "2d6+3. Push the target."
    );
    expect(within(action).getByText("On a crit:").tagName).toBe("STRONG");
  });

  it("labels structured counts, targets, areas and alternatives in the damage paragraph", () => {
    const { container } = render(
      <ActionsList
        conditions={[]}
        noInteractive
        actions={[
          {
            id: "pudding",
            name: "Acidic Touch",
            damage: "1d6+6",
            target: { reach: 2 },
            attackCount: 2,
          },
          {
            id: "worm",
            name: "Crush",
            damage: "d88",
            area: { shape: "line", size: 4 },
          },
          {
            id: "goblin",
            name: "Stab",
            damage: "1d6",
            alternative: { name: "Shoot", target: { range: 8 } },
          },
          { id: "square", name: "Blast", area: { shape: "square", size: 2 } },
          {
            id: "cone",
            name: "Breath",
            area: { shape: "cone", size: 4 },
          },
        ]}
      />
    );
    expect(container).toHaveTextContent("Acidic Touch (2×)");
    expect(container).toHaveTextContent("Reach 2");
    expect(container).toHaveTextContent("(Line 4)");
    expect(container).toHaveTextContent("or Shoot, Range 8");
    expect(container).toHaveTextContent("2×2 AoE");
    expect(container).toHaveTextContent("(Cone 4)");
    expect(container).not.toHaveTextContent(/\bft\b/);
    const paragraph = screen.getAllByRole("listitem")[0].querySelector("p");
    expect(paragraph).toHaveTextContent("1d6+6. (Reach 2)");
    expect(paragraph?.querySelector("[data-dice-notation]")).not.toBeNull();
  });

  it("keeps ability effects in descriptions while preserving action range text", () => {
    const { container } = render(
      <>
        <AbilityOverlay
          conditions={[]}
          noInteractive
          abilities={[
            {
              id: "burst",
              name: "Burst Lightning",
              description: "On death, Reach 1, AoE: 2d8 (ignores metal armor).",
            },
            {
              id: "aura",
              name: "Terror",
              description: "Aura 3: Frightened.",
            },
          ]}
        />
        <ActionsList
          conditions={[]}
          noInteractive
          actions={[{ id: "legacy", name: "Shoot", range: "8" }]}
        />
      </>
    );
    expect(container).toHaveTextContent("Reach 1, AoE");
    expect(container).toHaveTextContent("Aura 3");
    expect(container).toHaveTextContent("On death");
    expect(container).toHaveTextContent("(8)");
    expect(container).not.toHaveTextContent(/\bft\b/);
  });
});
