import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TROLL_HUNTER } from "@/app/dev/monster-card/fixtures";
import type { MonsterFormState } from "@/lib/services/monsters";
import { getMonsterUrl } from "@/lib/utils/url";
import { Card } from "./Card";

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => <button type="button">Upvote</button>,
}));

afterEach(cleanup);

describe("monster cards", () => {
  it.each([false, true])(
    "preserves regular/Legendary content and navigation (legendary=%s)",
    (legendary) => {
      const monster: MonsterFormState = {
        ...TROLL_HUNTER,
        legendary,
        kind: "Legacy descriptor",
        hpPerHero: legendary ? 47 : undefined,
        creatureTypes: ["giant"],
        environments: ["swamp", "ruins"],
        role: "aoe",
        bloodied: "Retreats underground.",
        lastStand: "Shatters the cavern.",
        source: undefined,
      };
      const { container } = render(
        <Card monster={monster} creator={monster.creator} hideActions />
      );
      expect(screen.getByRole("link", { name: monster.name })).toHaveAttribute(
        "href",
        getMonsterUrl(monster)
      );
      expect(screen.getByText(monster.creator.displayName)).toBeInTheDocument();
      expect(screen.getByText(/Troll Blood/)).toBeInTheDocument();
      expect(screen.getByText(/Fire \(V\), Acid \(V\)/)).toBeInTheDocument();
      expect(screen.getByText("Retreats underground.")).toBeInTheDocument();
      expect(screen.queryByText("Shatters the cavern.") !== null).toBe(
        legendary
      );
      expect(
        screen.getByText(legendary ? "47/hero" : "90")
      ).toBeInTheDocument();
      expect(container.querySelector("[data-level-label]")).toHaveTextContent(
        legendary ? "Lvl 10 Legendary Large Legacy descriptor" : "Lvl 10, large"
      );
      expect(
        screen.getByText("Environment").nextElementSibling
      ).toHaveTextContent("swamp, ruins");
      expect(screen.getByText("Role").nextElementSibling).toHaveTextContent(
        "AoE"
      );
      expect(
        within(
          screen.getByRole("heading").parentElement ?? container
        ).queryByText("Legacy descriptor") !== null
      ).toBe(!legendary);
    }
  );

  it.each(["large", "medium"] satisfies MonsterFormState["size"][])(
    "shows legendary %s size at most once and omits Medium",
    (size) => {
      const { container } = render(
        <Card
          monster={{
            ...TROLL_HUNTER,
            legendary: true,
            level: "3",
            levelInt: 3,
            size,
            kind: size === "large" ? "Large Owlbear" : "Medium Vampire Lord",
          }}
          noInteractive
        />
      );
      const label = container.querySelector("[data-level-label]");
      expect(label).toHaveTextContent(
        `Lvl 3 Legendary ${size === "large" ? "Large Owlbear" : "Vampire Lord"}`
      );
      expect(label).not.toHaveTextContent(/Large Large|Medium/);
    }
  );

  it("keeps selection separate from source controls and exposes its state", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Card
        monster={{
          ...TROLL_HUNTER,
          families: [],
          abilities: [],
          actions: [],
          source: {
            id: "source",
            name: "Nimble Heroes",
            abbreviation: "Heroes",
            license: "CC BY 4.0",
            link: "https://nimbleRPG.com",
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-01"),
          },
        }}
        selectable
        selected
        onSelect={onSelect}
      />
    );
    expect(
      screen.queryByRole("link", { name: TROLL_HUNTER.name })
    ).not.toBeInTheDocument();
    expect(container.querySelector("button button, button a")).toBeNull();
    const button = screen.getByRole("button", {
      name: `Select ${TROLL_HUNTER.name}`,
    });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Heroes" }));
    expect(
      await screen.findByRole("dialog", { name: "Nimble Heroes" })
    ).toHaveTextContent("CC BY 4.0");
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it.each(["minion", "hazard", "team"])(
    "preserves %s combat semantics",
    (variant) => {
      const monster: MonsterFormState = {
        ...TROLL_HUNTER,
        minion: variant === "minion",
        hazard: variant === "hazard",
        legendary: variant === "team",
        hp: 99,
        armor: "heavy",
        speed: 8,
        paperforgeId: undefined,
        members:
          variant === "team"
            ? [
                {
                  id: "member",
                  name: "The other twin",
                  size: "small",
                  hp: 31,
                  armor: "medium",
                  saves: "WIL+",
                  actions: [],
                  abilities: [],
                },
              ]
            : [],
      };
      const { container } = render(<Card monster={monster} noInteractive />);
      expect(screen.queryByText("99") !== null).toBe(variant === "hazard");
      expect(screen.queryByText("H")).not.toBeInTheDocument();
      if (variant === "minion")
        expect(screen.getByText("8")).toBeInTheDocument();
      if (variant === "team") {
        expect(screen.getByText("The other twin")).toBeInTheDocument();
        expect(screen.getByText("31")).toBeInTheDocument();
        expect(screen.getByText("WIL+")).toBeInTheDocument();
      }
      expect(container.querySelector("[data-level-label]")).not.toBeNull();
    }
  );
});

describe("non-interactive monster card footer", () => {
  it("shows the creator and reactions for a saved monster", () => {
    render(
      <Card
        monster={TROLL_HUNTER}
        creator={TROLL_HUNTER.creator}
        noInteractive
      />
    );
    expect(
      screen.getByText(TROLL_HUNTER.creator.displayName)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upvote" })).toBeInTheDocument();
  });

  it("omits reactions for an unsaved monster with no id", () => {
    render(
      <Card
        monster={{ ...TROLL_HUNTER, id: "" }}
        creator={TROLL_HUNTER.creator}
        noInteractive
      />
    );
    expect(
      screen.getByText(TROLL_HUNTER.creator.displayName)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upvote" })
    ).not.toBeInTheDocument();
  });
});
