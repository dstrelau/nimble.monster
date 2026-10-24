import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TROLL_HUNTER } from "@/app/dev/monster-card/fixtures";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import type { MonsterFormState } from "@/lib/services/monsters";
import { getMonsterUrl } from "@/lib/utils/url";
import { Card } from "./Card";

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

afterEach(cleanup);

describe.each([false, true])("monster cards with layout flag=%s", (enabled) => {
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
        <FeatureFlagsProvider
          enabledFeatures={enabled ? ["monster-card-layout"] : []}
        >
          <Card monster={monster} creator={monster.creator} hideActions />
        </FeatureFlagsProvider>
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
      if (enabled) {
        expect(container.querySelector("[data-level-label]")).toHaveTextContent(
          legendary
            ? "Lvl 10 Legendary large Legacy descriptor"
            : "Lvl 10, large"
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
      } else {
        expect(container.querySelector("[data-level-label]")).toBeNull();
        expect(
          screen.queryByLabelText("Monster metadata")
        ).not.toBeInTheDocument();
        expect(screen.getByText(/Legacy descriptor/i)).toBeInTheDocument();
      }
    }
  );

  it("keeps selectable names unlinked and the level tab selectable", () => {
    const onSelect = vi.fn();
    render(
      <FeatureFlagsProvider
        enabledFeatures={enabled ? ["monster-card-layout"] : []}
      >
        <Card
          monster={{
            ...TROLL_HUNTER,
            families: [],
            abilities: [],
            actions: [],
          }}
          selectable
          selected
          onSelect={onSelect}
        />
      </FeatureFlagsProvider>
    );
    expect(
      screen.queryByRole("link", { name: TROLL_HUNTER.name })
    ).not.toBeInTheDocument();
    const button = screen.getByRole("button");
    fireEvent.click(enabled ? screen.getByText(/Lvl/) : button);
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
      const { container } = render(
        <FeatureFlagsProvider
          enabledFeatures={enabled ? ["monster-card-layout"] : []}
        >
          <Card monster={monster} noInteractive />
        </FeatureFlagsProvider>
      );
      expect(screen.queryByText("99") !== null).toBe(variant === "hazard");
      expect(screen.queryByText("H")).not.toBeInTheDocument();
      if (variant === "minion")
        expect(screen.getByText("8")).toBeInTheDocument();
      if (variant === "team") {
        expect(screen.getByText("The other twin")).toBeInTheDocument();
        expect(screen.getByText("31")).toBeInTheDocument();
        expect(screen.getByText("WIL+")).toBeInTheDocument();
      }
      expect(container.querySelector("[data-level-label]") !== null).toBe(
        enabled
      );
    }
  );
});
