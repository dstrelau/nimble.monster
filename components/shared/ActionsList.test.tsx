import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TROLL_HUNTER } from "@/app/dev/monster-card/fixtures";
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
});
