import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/lib/services/items";
import type { User } from "@/lib/types";
import { CardGrid } from "./CardGrid";

vi.mock("./Card", () => ({
  Card: ({ item }: { item: Item }) => <div>{item.name}</div>,
}));

afterEach(() => {
  cleanup();
});

const creator: User = {
  id: "creator",
  discordId: "",
  username: "creator",
  displayName: "Creator",
};

const item: Item = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Grid Item",
  description: "Description",
  rarity: "common",
  visibility: "public",
  creator,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Item CardGrid", () => {
  it("uses statically discoverable responsive column classes", () => {
    const { container } = render(
      <CardGrid items={[item]} gridColumns={{ default: 1, md: 1, lg: 2 }} />
    );

    expect(container.firstChild).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-1",
      "lg:grid-cols-2"
    );
  });
});
