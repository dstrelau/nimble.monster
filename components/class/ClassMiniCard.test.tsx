import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Class } from "@/lib/types";
import { ClassMiniCard } from "./ClassMiniCard";

afterEach(cleanup);

const classEntity: Class = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Berserker",
  subclassNamePreface: "",
  description: "Wrath and Ruin",
  visibility: "public",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  keyStats: ["STR", "DEX"],
  hitDie: "d12",
  startingHp: 12,
  saves: { STR: 1, DEX: 1, INT: 0, WIL: 0 },
  armor: [],
  weapons: [],
  startingGear: [],
  levels: [],
  abilityLists: [],
  creator: {
    id: "creator",
    discordId: "creator-discord",
    username: "creator",
    displayName: "Creator",
    imageUrl: "",
  },
  source: {
    id: "heroes",
    name: "Nimble Heroes",
    abbreviation: "Heroes",
    license: "CC BY 4.0",
    link: "https://nimbleRPG.com",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
};

it("keeps selection and source details as independent native controls", async () => {
  const onSelect = vi.fn();
  const { container, rerender } = render(
    <ClassMiniCard classEntity={classEntity} selectable onSelect={onSelect} />
  );
  const selection = screen.getByRole("button", { name: "Select Berserker" });
  expect(selection).toHaveAttribute("aria-pressed", "false");
  expect(container.querySelector("button button, button a")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Heroes" }));
  expect(
    await screen.findByRole("dialog", { name: "Nimble Heroes" })
  ).toHaveTextContent("CC BY 4.0");
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Nimble Heroes" })).toHaveAttribute(
    "href",
    "https://nimbleRPG.com"
  );
  fireEvent.click(selection);
  expect(onSelect).toHaveBeenCalledTimes(1);
  rerender(
    <ClassMiniCard
      classEntity={classEntity}
      selectable
      selected
      onSelect={onSelect}
    />
  );
  expect(selection).toHaveAttribute("aria-pressed", "true");
});
