import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BuildClassView from "@/app/classes/BuildClassView";
import type { Class } from "@/lib/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getClassUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  deleteDraft: vi.fn(),
  onFormChange: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "owner", discordId: "owner-discord" } },
  }),
}));
vi.mock("@/lib/contexts/FeatureFlagsContext", () => ({
  useFeatureFlag: () => true,
}));
vi.mock("@/lib/hooks/useClassDraft", () => ({
  useClassDraft: () => ({
    draftState: "none",
    onFormChange: mocks.onFormChange,
    deleteDraftOnSave: mocks.deleteDraft,
  }),
}));
vi.mock("@/components/class/ClassDetailView", () => ({
  ClassDetailView: () => null,
}));
vi.mock("@/components/shared/EditableLevelAbilities", () => ({
  EditableLevelAbilities: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/layout/DiscordLoginButton", () => ({
  DiscordLoginButton: () => null,
}));

const classEntity: Class = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Old class",
  subclassNamePreface: "",
  description: "Old description",
  keyStats: ["INT", "WIL"],
  hitDie: "d6",
  startingHp: 7,
  saves: { STR: -1, DEX: 0, INT: 1, WIL: 0 },
  armor: [],
  weapons: [{ kind: "wand" }],
  startingGear: ["Telescope"],
  levels: [],
  abilityLists: [],
  visibility: "private",
  creator: UNKNOWN_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderBuilder(editing: boolean) {
  render(<BuildClassView classEntity={editing ? classEntity : undefined} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: " Stargazer " },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
    target: { value: " Read the stars. " },
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe.each([false, true])("class builder editing=%s", (editing) => {
  it("uses stable JSON without next-action, disables pending saves, clears draft and navigates/refreshes", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(editing);
    fireEvent.click(
      screen.getByRole("button", { name: editing ? "Update" : "Save" })
    );
    expect(
      await screen.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      editing ? "/_actions/updateClass" : "/_actions/createClass"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const body = JSON.parse(String(options.body));
    const input = editing ? body.input : body;
    expect(input).toMatchObject({
      name: "Stargazer",
      description: "Read the stars.",
      levels: [],
      abilityLists: [],
    });
    expect(input).not.toHaveProperty("discordId");
    if (editing) expect(body.id).toBe(classEntity.id);
    const result = { id: classEntity.id, name: "Stargazer" };
    finish(Response.json(result, { status: editing ? 200 : 201 }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(getClassUrl(result))
    );
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.deleteDraft).toHaveBeenCalledOnce();
  });

  it("keeps the draft and re-enables retry on a failed save without navigating or automatic retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(editing);
    fireEvent.click(
      screen.getByRole("button", { name: editing ? "Update" : "Save" })
    );
    expect(
      await screen.findByText(/Error (creating|updating) class: Unauthorized/)
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      " Stargazer "
    );
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      " Read the stars. "
    );
    expect(
      screen.getByRole("button", { name: editing ? "Update" : "Save" })
    ).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.deleteDraft).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
