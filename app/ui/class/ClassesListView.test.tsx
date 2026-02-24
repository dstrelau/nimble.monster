import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Class } from "@/lib/types";

const { mockUseQueryState } = vi.hoisted(() => ({
  mockUseQueryState: vi.fn(),
}));

vi.mock("nuqs", () => ({
  parseAsString: {},
  parseAsStringLiteral: () => ({ withDefault: (d: string) => d }),
  useQueryState: mockUseQueryState,
}));

vi.mock("@tanstack/react-pacer", () => ({
  useDebouncedValue: (value: unknown) => [value],
}));

vi.mock("@/components/app/SourceFilter", () => ({
  SourceFilter: () => <div>source-filter</div>,
}));

vi.mock("@/components/icons/PolyhedralDice", () => ({
  DieFromNotation: () => null,
}));

vi.mock("./ClassMiniCard", () => ({
  ClassMiniCard: ({ classEntity }: { classEntity: { name: string } }) => (
    <div data-testid="class-card">{classEntity.name}</div>
  ),
}));

import { ClassesListView } from "./ClassesListView";

const makeClass = (
  overrides: Partial<Class> & { id: string; name: string }
): Class => ({
  visibility: "public",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  description: "",
  keyStats: [],
  hitDie: "d8",
  startingHp: 8,
  saves: {} as Class["saves"],
  armor: [],
  weapons: {} as Class["weapons"],
  startingGear: [],
  levels: [],
  abilityLists: [],
  creator: {
    id: "u1",
    discordId: "d1",
    username: "user",
    displayName: "User",
    imageUrl: "",
  },
  ...overrides,
});

const FIGHTER = makeClass({
  id: "1",
  name: "Fighter",
  description: "A warrior",
  createdAt: new Date("2024-01-01"),
  source: {
    id: "s1",
    name: "Core",
    abbreviation: "CR",
    license: "",
    link: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

const WIZARD = makeClass({
  id: "2",
  name: "Wizard",
  description: "A spellcaster who studies arcane magic",
  createdAt: new Date("2024-06-01"),
});

const ROGUE = makeClass({
  id: "3",
  name: "Rogue",
  description: "A sneaky character",
  createdAt: new Date("2024-03-01"),
  source: {
    id: "s2",
    name: "Expansion",
    abbreviation: "EX",
    license: "",
    link: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

const ALL = [FIGHTER, WIZARD, ROGUE];

function setupQueryState(
  search: string | null,
  sort: string,
  source: string | null
) {
  mockUseQueryState.mockImplementation((key: string) => {
    if (key === "search") return [search, vi.fn()];
    if (key === "sort") return [sort, vi.fn()];
    if (key === "source") return [source, vi.fn()];
    return [null, vi.fn()];
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ClassesListView", () => {
  beforeEach(() => {
    setupQueryState(null, "name-asc", null);
  });

  it("renders all classes when no filters active", () => {
    render(<ClassesListView classes={ALL} />);
    expect(screen.getByText("Fighter")).toBeInTheDocument();
    expect(screen.getByText("Wizard")).toBeInTheDocument();
    expect(screen.getByText("Rogue")).toBeInTheDocument();
  });

  it("filters by name search", () => {
    setupQueryState("fig", "name-asc", null);
    render(<ClassesListView classes={ALL} />);
    expect(screen.getByText("Fighter")).toBeInTheDocument();
    expect(screen.queryByText("Wizard")).not.toBeInTheDocument();
    expect(screen.queryByText("Rogue")).not.toBeInTheDocument();
  });

  it("filters by description search", () => {
    setupQueryState("arcane", "name-asc", null);
    render(<ClassesListView classes={ALL} />);
    expect(screen.queryByText("Fighter")).not.toBeInTheDocument();
    expect(screen.getByText("Wizard")).toBeInTheDocument();
    expect(screen.queryByText("Rogue")).not.toBeInTheDocument();
  });

  it("filters by source abbreviation", () => {
    setupQueryState(null, "name-asc", "CR");
    render(<ClassesListView classes={ALL} />);
    expect(screen.getByText("Fighter")).toBeInTheDocument();
    expect(screen.queryByText("Wizard")).not.toBeInTheDocument();
    expect(screen.queryByText("Rogue")).not.toBeInTheDocument();
  });

  it("shows empty state when no classes match", () => {
    setupQueryState("zzz", "name-asc", null);
    render(<ClassesListView classes={ALL} />);
    expect(screen.queryByText("Fighter")).not.toBeInTheDocument();
    expect(screen.queryByText("Wizard")).not.toBeInTheDocument();
    expect(screen.queryByText("Rogue")).not.toBeInTheDocument();
  });

  it("sorts by name ascending", () => {
    setupQueryState(null, "name-asc", null);
    render(<ClassesListView classes={ALL} />);
    const names = screen
      .getAllByTestId("class-card")
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(["Fighter", "Rogue", "Wizard"]);
  });

  it("sorts by name descending", () => {
    setupQueryState(null, "name-desc", null);
    render(<ClassesListView classes={ALL} />);
    const names = screen
      .getAllByTestId("class-card")
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(["Wizard", "Rogue", "Fighter"]);
  });

  it("sorts by created descending (newest first)", () => {
    setupQueryState(null, "created-desc", null);
    render(<ClassesListView classes={ALL} />);
    const names = screen
      .getAllByTestId("class-card")
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(["Wizard", "Rogue", "Fighter"]);
  });

  it("sorts by created ascending (oldest first)", () => {
    setupQueryState(null, "created-asc", null);
    render(<ClassesListView classes={ALL} />);
    const names = screen
      .getAllByTestId("class-card")
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(["Fighter", "Rogue", "Wizard"]);
  });
});
