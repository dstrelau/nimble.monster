import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateEditCollection } from "@/app/collections/CreateEditCollection";
import { CreateEditEncounter } from "@/app/encounters/CreateEditEncounter";
import { call } from "@/lib/contract";
import type { Collection, Encounter, User } from "@/lib/types";
import { getCollectionUrl, getEncounterUrl } from "@/lib/utils/url";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "owner" } } }),
}));
vi.mock("@/lib/contract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contract")>()),
  call: vi.fn(),
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/monster/SelectableMonsterGrid", () => ({
  SelectableMonsterGrid: () => null,
}));
vi.mock("@/components/monster/Card", () => ({ Card: () => null }));
vi.mock("@/app/encounters/EncounterMonsterRow", () => ({
  EncounterMonsterRow: () => null,
}));
vi.mock("@/app/encounters/EncounterStatsPanel", () => ({
  EncounterStatsPanel: () => null,
}));
vi.mock("@/components/collection/CollectionCard", () => ({
  CollectionCard: () => null,
}));
vi.mock("@/app/collections/[id]/edit/VisibilityToggle", () => ({
  VisibilityToggle: () => null,
}));
vi.mock("@/app/collections/SelectableAncestryGrid", () => ({
  SelectableAncestryGrid: () => null,
}));
vi.mock("@/app/collections/SelectableBackgroundGrid", () => ({
  SelectableBackgroundGrid: () => null,
}));
vi.mock("@/app/collections/SelectableClassGrid", () => ({
  SelectableClassGrid: () => null,
}));
vi.mock("@/app/collections/SelectableCompanionGrid", () => ({
  SelectableCompanionGrid: () => null,
}));
vi.mock("@/app/collections/SelectableItemGrid", () => ({
  SelectableItemGrid: () => null,
}));
vi.mock("@/app/collections/SelectableSpellSchoolGrid", () => ({
  SelectableSpellSchoolGrid: () => null,
}));
vi.mock("@/app/collections/SelectableSubclassGrid", () => ({
  SelectableSubclassGrid: () => null,
}));

const creator: User = {
  id: "owner",
  discordId: "discord-owner",
  username: "owner",
  displayName: "Owner",
};

const emptyEncounter: Encounter = {
  id: "",
  creator,
  name: "",
  visibility: "private",
  heroCount: 4,
  heroLevel: 1,
  monsters: [],
};

const emptyCollection: Collection = {
  id: "",
  creator,
  name: "",
  visibility: "private",
  legendaryCount: 0,
  standardCount: 0,
  monsters: [],
  items: [],
  itemCount: 0,
  companions: [],
  ancestries: [],
  backgrounds: [],
  subclasses: [],
  spellSchools: [],
  classes: [],
};

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("encounter editor mutation", () => {
  it("preserves the draft while pending and navigates after success", async () => {
    const pending = deferred<{ id: string; name: string }>();
    vi.mocked(call).mockReturnValueOnce(pending.promise);
    render(<CreateEditEncounter encounter={emptyEncounter} isCreating />);

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Bridge Ambush" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    const saving = await screen.findByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(name).toHaveValue("Bridge Ambush");
    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: "Bridge Ambush", monsters: [] })
    );

    const result = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Bridge Ambush",
    };
    pending.resolve(result);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(getEncounterUrl(result))
    );
  });

  it("shows a save failure without clearing the draft", async () => {
    vi.mocked(call).mockRejectedValueOnce(new Error("Save unavailable; retry"));
    render(<CreateEditEncounter encounter={emptyEncounter} isCreating />);

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Unsaved Encounter" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Save unavailable; retry")).toBeVisible();
    expect(name).toHaveValue("Unsaved Encounter");
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("collection editor mutation", () => {
  it("preserves the draft while pending and navigates after success", async () => {
    const pending = deferred<{ id: string; name: string }>();
    vi.mocked(call).mockReturnValueOnce(pending.promise);
    render(<CreateEditCollection collection={emptyCollection} isCreating />);

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Campaign Kit" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    const saving = await screen.findByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(name).toHaveValue("Campaign Kit");
    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: "Campaign Kit", monsterIds: [] })
    );

    const result = {
      id: "660e8400-e29b-41d4-a716-446655440000",
      name: "Campaign Kit",
    };
    pending.resolve(result);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(getCollectionUrl(result))
    );
  });

  it("shows a save failure without clearing the draft", async () => {
    vi.mocked(call).mockRejectedValueOnce(new Error("Collection save failed"));
    render(<CreateEditCollection collection={emptyCollection} isCreating />);

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Unsaved Collection" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Collection save failed")).toBeVisible();
    expect(name).toHaveValue("Unsaved Collection");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
