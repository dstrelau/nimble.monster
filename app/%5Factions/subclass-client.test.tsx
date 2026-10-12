import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BuildSubclassView from "@/app/subclasses/BuildSubclassView";
import type { Subclass } from "@/lib/types";
import { UNKNOWN_USER } from "@/lib/types";
import { getSubclassUrl } from "@/lib/utils/url";

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
vi.mock("@/app/subclasses/hooks", () => ({
  subclassClassOptionsQueryOptions: () => ({
    queryKey: ["subclass-class-options"],
    queryFn: async () => [],
  }),
}));
vi.mock("@/components/subclass/Card", () => ({ Card: () => null }));
vi.mock("@/components/shared/EditableLevelAbilities", () => ({
  EditableLevelAbilities: () => null,
}));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/layout/DiscordLoginButton", () => ({
  DiscordLoginButton: () => null,
}));

const subclass: Subclass = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Old path",
  className: "Berserker",
  namePreface: "Path of the",
  description: "",
  levels: [],
  abilityLists: [],
  visibility: "private",
  creator: UNKNOWN_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};
function renderBuilder(editing: boolean) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BuildSubclassView subclass={editing ? subclass : undefined} />
    </QueryClientProvider>
  );
  if (!editing) fireEvent.click(screen.getByRole("button", { name: "Empty" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: " Red Mist " },
  });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe.each([false, true])("subclass builder editing=%s", (editing) => {
  it("saves to stable JSON URLs without next-action and preserves pending/draft/canonical navigation behavior", async () => {
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
      editing ? "/_actions/updateSubclass" : "/_actions/createSubclass"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const body = JSON.parse(String(options.body));
    const input = editing ? body.input : body;
    expect(input).toMatchObject({
      name: "Red Mist",
      className: "Berserker",
      levels: [],
      abilityLists: [],
    });
    expect(input).not.toHaveProperty("discordId");
    if (editing) expect(body.id).toBe(subclass.id);
    const result = {
      id: subclass.id,
      name: "Red Mist",
      namePreface: "Path of the",
    };
    finish(Response.json(result, { status: editing ? 200 : 201 }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(getSubclassUrl(result))
    );
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.deleteDraft).toHaveBeenCalledOnce();
  });
  it("keeps unsaved input and permits retry after an actionable inline error", async () => {
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
      await screen.findByText(
        /Error (creating|updating) subclass: Unauthorized/
      )
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      " Red Mist "
    );
    expect(
      screen.getByRole("button", { name: editing ? "Update" : "Save" })
    ).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.deleteDraft).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
