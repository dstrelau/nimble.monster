import { readFileSync } from "node:fs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BuildMonsterView from "@/app/monsters/BuildMonsterView";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import { call } from "@/lib/contract";
import type { FeatureFlag } from "@/lib/services/featureFlags";
import { toHazardMonsterView } from "@/lib/services/hazards/converters";
import type { MonsterFormState } from "@/lib/services/monsters";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import { getMonsterUrl } from "@/lib/utils/url";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "owner",
        discordId: "discord-owner",
        username: "owner",
        displayName: "Owner",
      },
    },
  }),
}));
vi.mock("@/lib/contract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contract")>()),
  call: vi.fn(),
}));
vi.mock("@/app/families/hooks", () => ({
  useUserFamiliesQuery: () => ({ data: [] }),
}));
vi.mock("@/components/shared/BuildView", () => ({
  BuildView: ({ formContent }: { formContent: ReactNode }) => formContent,
}));
vi.mock("@/components/shared/ExampleLoader", () => ({
  ExampleLoader: () => null,
}));
vi.mock("@/components/create/AbilitiesSection", () => ({
  AbilitiesSection: () => null,
}));
vi.mock("@/components/create/MembersSection", () => ({
  emptyMember: () => ({}),
  MembersSection: () => null,
}));
vi.mock("@/components/create/SourceSelect", () => ({
  SourceSelect: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/monster/Card", () => ({ Card: () => null }));
vi.mock("@/components/paperforge/PaperforgeImageSelect", () => ({
  PaperforgeImageSelect: () => null,
  PaperforgeImageChoices: () => null,
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function renderBuilder(
  hazard = false,
  existingMonster?: MonsterFormState,
  statblock = false,
  features: FeatureFlag[] = []
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  render(
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider
        enabledFeatures={
          statblock ? ["monster-statblock-editor", ...features] : features
        }
      >
        <BuildMonsterView hazard={hazard} existingMonster={existingMonster} />
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
  return { invalidate };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bestiary builder mutation", () => {
  it.each([
    ["Standard", "Goblin", "Goblin Taskmaster"],
    ["Legendary", "Manticore", "Ravager of the Lowlands"],
    ["Minion", "Kobold", "Kobold Minion"],
    ["Team", "Team", "Kelebek & Poppy"],
  ])(
    "loads only the %s example and confirms before clearing",
    (kind, example, name) => {
      renderBuilder(false, undefined, true);
      if (kind !== "Standard") {
        fireEvent.keyDown(
          screen.getByRole("combobox", { name: "Monster type" }),
          {
            key: "ArrowDown",
          }
        );
        fireEvent.click(screen.getByRole("option", { name: kind }));
      }
      fireEvent.click(
        screen.getByRole("button", { name: "Start from an example" })
      );
      expect(screen.getByText("Load example:")).toBeInTheDocument();
      for (const other of ["Goblin", "Manticore", "Kobold", "Team"]) {
        expect(screen.queryByRole("button", { name: other }) !== null).toBe(
          other === example
        );
      }
      expect(
        screen.queryByRole("button", { name: "Empty" })
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: example }));
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(name);
      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      const dialog = screen.getByRole("alertdialog");
      expect(within(dialog).getByText("Clear form?")).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(name);
      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      fireEvent.click(
        within(screen.getByRole("alertdialog")).getByRole("button", {
          name: "Clear",
        })
      );
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
      expect(
        screen.getByRole("combobox", { name: "Monster type" })
      ).toHaveTextContent(kind);
    }
  );

  it("opts flagged monsters into the editor and keeps draft fields across preview", async () => {
    vi.mocked(call).mockRejectedValueOnce(new Error("Try again"));
    renderBuilder(false, undefined, true);
    const tasks = within(
      screen.getByRole("navigation", { name: "Monster build tasks" })
    );
    expect(
      screen.getByRole("combobox", { name: "Monster type" })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Draft goblin" },
    });
    fireEvent.click(tasks.getByRole("button", { name: /^Finishing touches/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Keeps the other goblins in line." },
    });
    fireEvent.click(tasks.getByRole("button", { name: /^Traits/ }));
    fireEvent.click(tasks.getByRole("button", { name: /^Finishing touches/ }));
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Keeps the other goblins in line."
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Preview" })[0]);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Back to editing" })[0]
    );
    fireEvent.click(tasks.getByRole("button", { name: /^Basics/ }));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Draft goblin"
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Save monster" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Draft goblin"
    );
  });

  it("hides legendary movement controls without losing the standard draft's movement", () => {
    renderBuilder(false, undefined, true);
    const tasks = within(
      screen.getByRole("navigation", { name: "Monster build tasks" })
    );
    fireEvent.click(tasks.getByRole("button", { name: /^Defenses/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Speed" }), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Movement types/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Fly" }), {
      target: { value: "3" },
    });
    fireEvent.click(tasks.getByRole("button", { name: /^Basics/ }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Monster type" }), {
      key: "ArrowDown",
    });
    fireEvent.click(screen.getByRole("option", { name: "Legendary" }));
    fireEvent.click(tasks.getByRole("button", { name: /^Defenses/ }));
    expect(
      screen.queryByRole("spinbutton", { name: "Speed" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Movement types/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Saves" })).toBeInTheDocument();

    fireEvent.click(tasks.getByRole("button", { name: /^Basics/ }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Monster type" }), {
      key: "ArrowDown",
    });
    fireEvent.click(screen.getByRole("option", { name: "Standard" }));
    fireEvent.click(tasks.getByRole("button", { name: /^Defenses/ }));
    expect(screen.getByRole("spinbutton", { name: "Speed" })).toHaveValue(9);
    fireEvent.click(screen.getByRole("button", { name: /^Movement types/ }));
    expect(screen.getByRole("spinbutton", { name: "Fly" })).toHaveValue(3);
  });

  it("preserves defenses and classification selections through navigation and update", async () => {
    const { monsters } = validateOfficialMonstersJSON(
      JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
    );
    const official = monsters.find(
      (monster) => monster.attributes.name === "Ogre Zombie"
    );
    if (!official) throw new Error("Missing official Ogre Zombie");
    const input = parseJSONAPIMonster(official);
    const existing: MonsterFormState = {
      ...input,
      id: "550e8400-e29b-41d4-a716-446655440000",
      hazard: false,
      armor: input.armor || "none",
      legendary: input.legendary ?? false,
      minion: input.minion ?? false,
      paperforgeId: input.paperforgeId ?? undefined,
      saves: input.saves?.join(" ") ?? "",
      families: [],
      creatureTypes: ["undead"],
      creatureKinds: ["zombie"],
      environments: [],
      creator: {
        id: "owner",
        discordId: "discord-owner",
        username: "owner",
        displayName: "Owner",
      },
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    vi.mocked(call).mockResolvedValueOnce(existing);
    renderBuilder(false, existing, true);
    const tasks = within(
      screen.getByRole("navigation", { name: "Monster build tasks" })
    );
    fireEvent.click(tasks.getByRole("button", { name: /^Defenses/ }));
    const level = screen.getByRole("combobox", { name: "Level" });
    fireEvent.keyDown(level, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "2" }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Armor" }), {
      key: "ArrowDown",
    });
    fireEvent.click(await screen.findByRole("option", { name: "Medium" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "HP" }), {
      target: { value: "37" },
    });
    fireEvent.keyDown(level, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "3" }));
    expect(screen.getByRole("spinbutton", { name: "HP" })).toHaveValue(37);
    fireEvent.click(screen.getByRole("button", { name: "Use 33" }));
    expect(screen.getByRole("spinbutton", { name: "HP" })).toHaveValue(33);
    fireEvent.click(screen.getByRole("button", { name: "per hero" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "HP / hero" }), {
      target: { value: "13" },
    });
    fireEvent.click(tasks.getByRole("button", { name: /^Traits/ }));
    fireEvent.click(tasks.getByRole("button", { name: /^Defenses/ }));
    fireEvent.click(screen.getByRole("button", { name: "per hero" }));
    expect(screen.getByRole("spinbutton", { name: "HP" })).toHaveValue(33);
    fireEvent.click(screen.getByRole("button", { name: "per hero" }));
    expect(screen.getByRole("spinbutton", { name: "HP / hero" })).toHaveValue(
      13
    );
    fireEvent.click(tasks.getByRole("button", { name: /^Finishing touches/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Classification/ }));
    const types = within(
      screen.getByRole("group", { name: "Creature types" })
    ).getByRole("combobox");
    expect(types).toHaveTextContent("Undead");
    fireEvent.click(types);
    fireEvent.click(screen.getByRole("option", { name: "Undead" }));
    fireEvent.keyDown(screen.getByPlaceholderText("Search..."), {
      key: "Escape",
    });
    expect(types).toHaveTextContent("Select creature types");

    const kinds = within(
      screen.getByRole("group", { name: "Creature kinds" })
    ).getByRole("combobox");
    expect(kinds).toHaveTextContent("Zombie");
    fireEvent.click(kinds);
    fireEvent.click(screen.getByRole("option", { name: "Ogre" }));
    fireEvent.keyDown(screen.getByPlaceholderText("Search..."), {
      key: "Escape",
    });
    fireEvent.click(
      within(screen.getByRole("group", { name: "Environments" })).getByRole(
        "combobox"
      )
    );
    fireEvent.click(screen.getByRole("option", { name: "Swamp" }));
    fireEvent.click(screen.getByRole("option", { name: "Graveyard" }));
    fireEvent.keyDown(screen.getByPlaceholderText("Search..."), {
      key: "Escape",
    });
    expect(call).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Save monster" })[0]);
    await waitFor(() =>
      expect(call).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kind: "monster",
          input: expect.objectContaining({
            id: existing.id,
            hp: 0,
            hpPerHero: 13,
            levelInt: 3,
            armor: "medium",
            creatureTypes: [],
            creatureKinds: ["zombie", "ogre"],
            environments: ["swamp", "graveyard"],
          }),
        })
      )
    );

    cleanup();
    vi.mocked(call).mockClear();
    vi.mocked(call).mockResolvedValueOnce(existing);
    renderBuilder(false, existing, false);
    expect(
      screen.queryByRole("button", { name: /^Classification/ })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(call).toHaveBeenCalledOnce());
    const request = vi.mocked(call).mock.calls[0][1];
    expect(request).toHaveProperty("input.id", existing.id);
    expect(request).not.toHaveProperty("input.creatureTypes");
    expect(request).not.toHaveProperty("input.creatureKinds");
    expect(request).not.toHaveProperty("input.environments");
  });

  it("keeps hazards on the existing editor even with the flag", () => {
    renderBuilder(true, undefined, true);
    expect(
      screen.queryByRole("combobox", { name: "Monster type" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "HP (optional)" })
    ).toBeInTheDocument();
  });

  it("does not enable Build bench with only the artwork flag", () => {
    renderBuilder(false, undefined, false, ["monster-custom-artwork"]);
    expect(
      screen.queryByRole("navigation", { name: "Monster build tasks" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose image" })
    ).toBeInTheDocument();
  });

  it("saves artwork credits and structured attacks after switching tasks", async () => {
    const artwork = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      userId: "22222222-2222-2222-2222-222222222222",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => artwork }))
    );
    vi.mocked(call).mockResolvedValueOnce({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Bench draft",
      hazard: false,
    });
    renderBuilder(false, undefined, true, ["monster-custom-artwork"]);
    const tasks = within(
      screen.getByRole("navigation", { name: "Monster build tasks" })
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Bench draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose image" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Upload" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.change(screen.getByLabelText("Image file"), {
      target: {
        files: [new File(["image"], "art.png", { type: "image/png" })],
      },
    });
    await screen.findByLabelText("Artist (optional)");
    fireEvent.change(screen.getByLabelText("Artist (optional)"), {
      target: { value: "Morgan Vale" },
    });
    fireEvent.change(screen.getByLabelText("Source URL (optional)"), {
      target: { value: "https://example.com/art" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    fireEvent.click(tasks.getByRole("button", { name: /^Actions/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add action" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Action name" }), {
      target: { value: "Blast" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Attack details/ }));
    fireEvent.change(screen.getByLabelText("Attack count"), {
      target: { value: "3" },
    });
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Area" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("option", { name: "Line" }));
    fireEvent.change(screen.getByLabelText("Length (spaces)"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Width (spaces)"), {
      target: { value: "2" },
    });
    fireEvent.click(tasks.getByRole("button", { name: /^Traits/ }));
    fireEvent.click(tasks.getByRole("button", { name: /^Actions/ }));
    expect(screen.getByRole("textbox", { name: "Action name" })).toHaveValue(
      "Blast"
    );
    fireEvent.click(screen.getByRole("button", { name: /^Attack details/ }));
    expect(screen.getByLabelText("Width (spaces)")).toHaveValue(2);
    fireEvent.click(tasks.getByRole("button", { name: /^Basics/ }));
    expect(
      screen.getByRole("button", { name: "Change image" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Save monster" })[0]);
    await waitFor(() =>
      expect(call).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kind: "monster",
          input: expect.objectContaining({
            paperforgeId: undefined,
            customArtwork: {
              ...artwork,
              artist: "Morgan Vale",
              sourceUrl: "https://example.com/art",
            },
            actions: [
              expect.objectContaining({
                name: "Blast",
                attackCount: 3,
                area: { shape: "line", size: 7, width: 2 },
              }),
            ],
          }),
        })
      )
    );
  });

  it("returns to Basics when saving an unnamed draft from another task", async () => {
    renderBuilder(false, undefined, true);
    fireEvent.click(screen.getByRole("button", { name: /^Finishing touches/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Save monster" })[0]);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Give your monster a name before saving."
    );
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(name).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(name).toHaveFocus());
    expect(call).not.toHaveBeenCalled();
  });

  it("starts hazard HP blank and sends entered HP on create", async () => {
    vi.mocked(call).mockResolvedValueOnce({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Barrier",
      hazard: true,
    });
    renderBuilder(true);
    const hp = screen.getByRole("spinbutton", { name: "HP (optional)" });
    expect(hp).toHaveValue(null);
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Barrier" },
    });
    fireEvent.change(hp, { target: { value: "37" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(call).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kind: "hazard",
          input: expect.objectContaining({ hp: 37 }),
        })
      );
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("loads saved hazard HP and clears it in the update payload", async () => {
    const existing = toHazardMonsterView({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Barrier",
      hazard: true,
      hp: 37,
      level: "2",
      levelInt: 2,
      visibility: "private",
      createdAt: new Date(),
      updatedAt: new Date(),
      abilities: [],
      actions: [],
      actionPreface: "",
      creator: {
        id: "owner",
        discordId: "discord-owner",
        username: "owner",
        displayName: "Owner",
      },
    });
    vi.mocked(call).mockResolvedValueOnce(existing);
    renderBuilder(true, existing);
    const hp = screen.getByRole("spinbutton", { name: "HP (optional)" });
    expect(hp).toHaveValue(37);
    fireEvent.change(hp, { target: { value: "" } });
    expect(hp).toHaveValue(null);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(call).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kind: "hazard",
          input: expect.objectContaining({ id: existing.id, hp: undefined }),
        })
      );
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("preserves the draft while pending, invalidates caches, and navigates", async () => {
    const pending = deferred<{ id: string; name: string; hazard: boolean }>();
    vi.mocked(call).mockReturnValueOnce(pending.promise);
    const { invalidate } = renderBuilder();

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Clockwork Goblin" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const saving = await screen.findByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(name).toHaveValue("Clockwork Goblin");
    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "monster",
        input: expect.objectContaining({ name: "Clockwork Goblin" }),
      })
    );

    const result = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Clockwork Goblin",
      hazard: false,
    };
    pending.resolve(result);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["monsters"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["hazards"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["nav-counts"] });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["monster", result.id],
      });
      expect(mockPush).toHaveBeenCalledWith(getMonsterUrl(result));
    });
  });

  it("shows a save failure without clearing the draft", async () => {
    vi.mocked(call).mockRejectedValueOnce(new Error("Monster save failed"));
    renderBuilder();

    const name = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: "Unsaved Monster" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Monster save failed"
    );
    expect(name).toHaveValue("Unsaved Monster");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
