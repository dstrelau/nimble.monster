import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BuildCompanionView from "@/app/companions/BuildCompanionView";
import { EXAMPLE_COMPANIONS } from "@/app/companions/exampleCompanions";
import { UNKNOWN_USER } from "@/lib/types";
import { getCompanionUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "owner", discordId: "discord-owner" } },
  }),
}));
vi.mock("@/components/companion/Card", () => ({ Card: () => null }));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/components/paperforge/PaperforgeImageSelect", () => ({
  PaperforgeImageSelect: () => null,
}));

const companion = {
  ...EXAMPLE_COMPANIONS.Stabs,
  id: "33333333-3333-3333-3333-333333333333",
  creator: UNKNOWN_USER,
};
function renderBuilder(editing: boolean) {
  const client = new QueryClient();
  client.setQueryData(["companions"], [companion]);
  client.setQueryData(["companion", companion.id], companion);
  render(
    <QueryClientProvider client={client}>
      <BuildCompanionView existingCompanion={editing ? companion : undefined} />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "QA Companion" },
  });
  return client;
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe.each([false, true])("companion builder editing=%s", (editing) => {
  it("saves via stable JSON URLs without next-action, with pending and fresh canonical navigation", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = renderBuilder(editing);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      editing ? "/_actions/updateCompanion" : "/_actions/createCompanion"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const body = JSON.parse(String(options.body));
    const input = editing ? body.input : body;
    expect(input).toMatchObject({
      name: "QA Companion",
      visibility: editing ? "public" : "private",
    });
    expect(input).not.toHaveProperty("discordId");
    if (editing) {
      expect(body.id).toBe(companion.id);
      expect(input.actions).toEqual(companion.actions);
      expect(input.abilities).toEqual(companion.abilities);
    }
    const result = { id: companion.id, name: "QA Companion" };
    finish(Response.json(result, { status: editing ? 200 : 201 }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(getCompanionUrl(result))
    );
    expect(mocks.refresh).toHaveBeenCalled();
    expect(client.getQueryState(["companions"])?.isInvalidated).toBe(true);
    expect(
      client.getQueryState(["companion", companion.id])?.isInvalidated
    ).toBe(true);
  });
  it("retains unsaved input, displays one actionable error and enables manual retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(editing);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Unauthorized")).toBeVisible();
    expect(screen.getAllByText("Unauthorized")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "QA Companion"
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(
      Response.json({ id: companion.id, name: "QA Companion" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  });
});
