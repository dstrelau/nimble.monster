import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Subclass } from "@/lib/types";
import { SubclassMiniCard } from "./SubclassMiniCard";

afterEach(cleanup);

const subclass: Subclass = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "the Abyssal Depths",
  namePreface: "Pact of",
  className: "Warlock",
  visibility: "public",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
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

it("keeps selection, source details, and creator navigation independent", async () => {
  const onSelect = vi.fn();
  const { container, rerender } = render(
    <SubclassMiniCard subclass={subclass} selectable onSelect={onSelect} />
  );
  const selection = screen.getByRole("button", {
    name: "Select Pact of the Abyssal Depths",
  });
  expect(selection).toHaveAttribute("aria-pressed", "false");
  expect(container.querySelector("button button, button a")).toBeNull();
  expect(screen.getByRole("link", { name: /Creator/ })).toHaveAttribute(
    "href",
    "/u/creator"
  );
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
    <SubclassMiniCard
      subclass={subclass}
      selectable
      selected
      onSelect={onSelect}
    />
  );
  expect(selection).toHaveAttribute("aria-pressed", "true");
});
