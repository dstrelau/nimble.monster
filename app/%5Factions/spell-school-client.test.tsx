import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BuildSchoolView from "@/app/spell-schools/BuildSchoolView";
import { type SpellSchool, UNKNOWN_USER } from "@/lib/types";
import { getSpellSchoolUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/lib/actions", () => ({ signInAction: vi.fn() }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "owner", discordId: "discord-owner" } },
  }),
}));
vi.mock("@/components/school/Card", () => ({ Card: () => null }));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
const school: SpellSchool = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Old school",
  visibility: "public",
  creator: UNKNOWN_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  spells: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      schoolId: "33333333-3333-4333-8333-333333333333",
      name: "Gust",
      tier: 2,
      actions: 3,
      reaction: true,
      utility: false,
      target: { type: "aoe", kind: "cone", distance: 7 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};
function renderBuilder(editing: boolean) {
  render(<BuildSchoolView existingSchool={editing ? school : undefined} />);
  fireEvent.change(screen.getByRole("textbox", { name: "School Name" }), {
    target: { value: "New school" },
  });
  if (!editing) {
    fireEvent.click(screen.getByRole("button", { name: "Add Spell" }));
    fireEvent.change(screen.getByRole("textbox", { name: /^Name$/ }), {
      target: { value: "Gust" },
    });
  }
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe.each([false, true])("spell-school builder editing=%s", (editing) => {
  const label = editing ? "Update School" : "Create School";
  it("uses stable JSON URLs without next-action, pending controls and fresh navigation", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(editing);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(
      await screen.findByRole("button", {
        name: editing ? "Updating..." : "Creating...",
      })
    ).toBeDisabled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      editing ? "/_actions/updateSpellSchool" : "/_actions/createSpellSchool"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const body = JSON.parse(String(options.body));
    const input = editing ? body.input : body;
    expect(input).toMatchObject({
      name: "New school",
      spells: [{ name: "Gust" }],
    });
    expect(input).not.toHaveProperty("discordId");
    if (editing) {
      expect(body.id).toBe(school.id);
      expect(input.spells[0]).toMatchObject({
        actions: 3,
        reaction: true,
        target: school.spells[0].target,
      });
    }
    const result = { id: school.id, name: "New school" };
    finish(Response.json(result, { status: editing ? 200 : 201 }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(getSpellSchoolUrl(result))
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it.each([
    "http",
    "network",
  ])("retains input after %s failure and permits manual retry", async (failure) => {
    const fetchMock = vi.fn();
    if (failure === "http")
      fetchMock.mockResolvedValue(
        Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    else fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(editing);
    fireEvent.click(screen.getByRole("button", { name: label }));
    const message = failure === "http" ? "Unauthorized" : "Failed to fetch";
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getAllByText(message)).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "School Name" })).toHaveValue(
      "New school"
    );
    expect(screen.getByRole("textbox", { name: /^Name$/ })).toHaveValue("Gust");
    expect(screen.getByRole("button", { name: label })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(
      Response.json({ id: school.id, name: "New school" })
    );
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  });
});
