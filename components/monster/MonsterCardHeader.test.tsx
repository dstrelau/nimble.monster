import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TROLL_HUNTER } from "@/app/dev/monster-card/fixtures";
import { MonsterCardHeader, MonsterCardLevelTab } from "./MonsterCardHeader";
import { MonsterCardMetadata } from "./MonsterCardMetadata";

afterEach(cleanup);

describe("monster card level tab", () => {
  it.each([false, true])(
    "uses the expanded official text only with legendary=%s",
    (legendary) => {
      render(
        <MonsterCardLevelTab
          monster={{
            ...TROLL_HUNTER,
            legendary,
            level: "1/2",
            levelInt: -2,
            size: "medium",
            kind: "Keeper of Forgotten Names",
          }}
        />
      );
      expect(screen.getByText(/medium/)).toHaveTextContent(
        legendary
          ? "Lvl 1/2 Legendary medium Keeper of Forgotten Names"
          : "Lvl 1/2, medium"
      );
      if (!legendary)
        expect(
          screen.queryByText(/Keeper of Forgotten Names/)
        ).not.toBeInTheDocument();
    }
  );
});

describe("monster card header", () => {
  it("preserves the regular descriptor, name, artwork, every movement mode and zero speed", () => {
    render(
      <MonsterCardHeader
        monster={{
          ...TROLL_HUNTER,
          name: "Captain Sylvestra Redmane, the Red Siren",
          level: "1/2",
          levelInt: -2,
          size: "medium",
          hp: 999,
          swim: 12,
          fly: 10,
          climb: 6,
          burrow: 4,
          teleport: 30,
          speed: 0,
          environments: ["forest"],
          kind: "Legacy descriptor",
          role: "aoe",
        }}
      />
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Captain Sylvestra Redmane, the Red Siren"
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
    for (const value of ["999", "12", "10", "6", "4", "30", "0"])
      expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.getByText("Legacy descriptor")).toBeInTheDocument();
    expect(screen.queryByText("forest")).not.toBeInTheDocument();
    expect(screen.queryByText("AoE")).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "preserves saves and compact defenses with legendary=%s",
    (legendary) => {
      render(
        <MonsterCardHeader
          monster={{
            ...TROLL_HUNTER,
            legendary,
            armor: "none",
            hpPerHero: 135,
            saves: "STR-, DEX++, INT+, WIL++",
            fly: 8,
            speed: 0,
            paperforgeId: undefined,
          }}
          damageInteractions={{
            resistant: ["fire", "poison"],
            vulnerable: ["ice"],
          }}
        />
      );
      expect(screen.getByText("135/hero")).toBeInTheDocument();
      expect(screen.getByText("STR-, DEX++, INT+, WIL++")).toBeInTheDocument();
      expect(screen.getByText("Saves:").parentElement).toHaveTextContent(
        "Saves: STR-, DEX++, INT+, WIL++"
      );
      expect(
        screen
          .getAllByText(/^(Saves|Vulnerable|Resistant):$/)
          .map((label) => label.textContent)
      ).toEqual(["Saves:", "Vulnerable:", "Resistant:"]);
      expect(screen.queryByText("Solo")).not.toBeInTheDocument();
      if (legendary) {
        expect(
          screen.queryByText(TROLL_HUNTER.kind ?? "")
        ).not.toBeInTheDocument();
      } else {
        expect(screen.getByText(TROLL_HUNTER.kind ?? "")).toBeInTheDocument();
      }
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.queryByText("0") !== null).toBe(!legendary);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByText("M")).not.toBeInTheDocument();
      expect(screen.getByText("Resistant:").parentElement).toHaveTextContent(
        /fire.*poison/
      );
      expect(screen.getByText("Vulnerable:").parentElement).toHaveTextContent(
        "ice"
      );
    }
  );
});

describe("monster card metadata", () => {
  it("pairs labels with multiple values without duplicating the header descriptor", () => {
    render(
      <MonsterCardMetadata
        monster={{
          ...TROLL_HUNTER,
          creatureTypes: ["undead", "humanoid"],
          creatureKinds: ["mind-flayer", "human"],
          environments: ["arctic", "ruins"],
          kind: "Keeper of Forgotten Names",
          role: "aoe",
        }}
      />
    );
    expect(screen.getByLabelText("Monster metadata").tagName).toBe("DL");
    expect(screen.getByText("Type").nextElementSibling).toHaveTextContent(
      "undead, humanoid"
    );
    expect(screen.getByText("Kind").nextElementSibling).toHaveTextContent(
      "mind flayer, human"
    );
    expect(
      screen.getByText("Environment").nextElementSibling
    ).toHaveTextContent("arctic, ruins");
    expect(screen.getByText("Role").nextElementSibling).toHaveTextContent(
      "AoE"
    );
    expect(
      screen.queryByText("Keeper of Forgotten Names")
    ).not.toBeInTheDocument();
  });

  it("omits empty rows and the entire section when no metadata is present", () => {
    const { container, rerender } = render(
      <MonsterCardMetadata
        monster={{
          ...TROLL_HUNTER,
          creatureTypes: [],
          creatureKinds: [],
          environments: [],
          kind: undefined,
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <MonsterCardMetadata
        monster={{
          ...TROLL_HUNTER,
          creatureTypes: [],
          creatureKinds: [],
          environments: ["aquatic"],
          kind: undefined,
        }}
      />
    );
    expect(
      screen.getByText("Environment").nextElementSibling
    ).toHaveTextContent("aquatic");
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Kind")).not.toBeInTheDocument();
    expect(screen.queryByText("Role")).not.toBeInTheDocument();
    expect(screen.queryByText("Descriptor")).not.toBeInTheDocument();
  });
});
