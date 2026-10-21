import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type SpellSchool, UNKNOWN_USER } from "@/lib/types";
import { Card } from "./Card";

vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));
vi.mock("@/components/EntityReactions", () => ({
  EntityReactions: () => null,
}));

afterEach(cleanup);

const school: SpellSchool = {
  id: "",
  name: "Ice Spells",
  visibility: "public",
  creator: UNKNOWN_USER,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  spells: [
    {
      id: "legacy",
      schoolId: "",
      name: "Cryosleep",
      tier: 3,
      actions: 2,
      reaction: false,
      version: 2,
      description: "Original sleep effect.",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: "current",
      schoolId: "",
      name: "Omenrime",
      tier: 3,
      actions: 1,
      reaction: false,
      version: 3,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: "unversioned",
      schoolId: "",
      name: "Ice Lance",
      tier: 0,
      actions: 1,
      reaction: false,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ],
};

describe("legacy spell sections", () => {
  it.each([false, true])(
    "explains legacy spells on icon focus (mini: %s)",
    async (mini) => {
      render(<Card spellSchool={school} link={false} mini={mini} />);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      fireEvent.focus(
        screen.getByRole("button", { name: "About legacy spells" })
      );
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "These spells are part of an older version of Nimble."
      );
      fireEvent.keyDown(document.activeElement || document.body, {
        key: "Escape",
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    }
  );

  it.each([false, true])(
    "shows legacy spells without per-spell badges (mini: %s)",
    (mini) => {
      render(<Card spellSchool={school} link={false} mini={mini} />);
      expect(screen.queryByText("Legacy")).not.toBeInTheDocument();
      expect(screen.getByText("Legacy Spells")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Cryosleep" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Omenrime" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Ice Lance" })
      ).toBeInTheDocument();
      if (!mini)
        expect(screen.getByText("Original sleep effect.")).toBeInTheDocument();
    }
  );

  it("also shows legacy utility spells without badges", () => {
    render(
      <Card
        spellSchool={{
          ...school,
          spells: school.spells.map((s) => ({ ...s, utility: true })),
        }}
        link={false}
      />
    );
    expect(screen.getByText("Utility")).toBeInTheDocument();
    expect(screen.getByText("Legacy Spells")).toBeInTheDocument();
    expect(screen.queryByText("Legacy")).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "groups all legacy spells after current utility spells (mini: %s)",
    (mini) => {
      render(
        <Card
          spellSchool={{
            ...school,
            spells: [
              school.spells[0],
              school.spells[1],
              { ...school.spells[2], name: "Ice Disk", utility: true },
              {
                ...school.spells[0],
                id: "legacy-utility",
                name: "Old Utility",
                utility: true,
              },
            ],
          }}
          link={false}
          mini={mini}
        />
      );
      expect(
        screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
      ).toEqual(["Omenrime", "Ice Disk", "Cryosleep", "Old Utility"]);
      expect(
        screen
          .getByText("Legacy Spells")
          .compareDocumentPosition(
            screen.getByRole("heading", { name: "Cryosleep" })
          ) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(
        screen
          .getByRole("heading", { name: "Ice Disk" })
          .compareDocumentPosition(screen.getByText("Legacy Spells")) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(screen.queryByText("Legacy")).not.toBeInTheDocument();
    }
  );

  it("omits the legacy section when there are no legacy spells", () => {
    render(
      <Card
        spellSchool={{
          ...school,
          spells: school.spells.filter((s) => s.version !== 2),
        }}
        link={false}
      />
    );
    expect(screen.queryByText("Legacy Spells")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "About legacy spells" })
    ).not.toBeInTheDocument();
  });
});
