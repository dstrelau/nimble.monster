import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateEditFamily } from "@/app/families/CreateEditFamily";
import { UNKNOWN_USER } from "@/lib/types";
import { getFamilyUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/app/families/FamilyHeader", () => ({ FamilyHeader: () => null }));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
const family = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Old name",
  description: "Old description",
  abilities: [{ id: "old", name: "Dive", description: "Move 3 spaces" }],
  creatorId: "owner",
  creator: UNKNOWN_USER,
};
function renderBuilder(creating: boolean) {
  render(<CreateEditFamily family={family} isCreating={creating} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Family Name" }), {
    target: { value: "New name" },
  });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe.each([true, false])("family builder creating=%s", (creating) => {
  it("uses stable JSON transport, pending controls and fresh renamed navigation", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(creating);
    fireEvent.click(
      screen.getByRole("button", { name: creating ? "Create" : "Save" })
    );
    expect(
      await screen.findByRole("button", {
        name: creating ? "Creating..." : "Saving...",
      })
    ).toBeDisabled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      creating ? "/_actions/createFamily" : "/_actions/updateFamily"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const body = JSON.parse(String(options.body));
    const input = creating ? body : body.input;
    expect(input).toMatchObject({
      name: "New name",
      description: "Old description",
      abilities: [
        { id: expect.any(String), name: "Dive", description: "Move 3 spaces" },
      ],
    });
    expect(input).not.toHaveProperty("discordId");
    if (!creating) expect(body.id).toBe(family.id);
    const result = { id: family.id, name: "New name" };
    finish(Response.json(result, { status: creating ? 201 : 200 }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(getFamilyUrl(result))
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it.each([
    "http",
    "network",
  ])("retains input after %s failures and permits only manual retry", async (failure) => {
    const fetchMock = vi.fn();
    if (failure === "http")
      fetchMock.mockResolvedValue(
        Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    else fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    renderBuilder(creating);
    const label = creating ? "Create" : "Save";
    fireEvent.click(screen.getByRole("button", { name: label }));
    const message = failure === "http" ? "Unauthorized" : "Failed to fetch";
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getAllByText(message)).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Family Name" })).toHaveValue(
      "New name"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: label })).toBeEnabled()
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(
      Response.json({ id: family.id, name: "New name" })
    );
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  });
});
