import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonsterDetailActions } from "@/app/monsters/MonsterDetailActions";
import { toHazardMonsterView } from "@/lib/services/hazards/converters";
import { UNKNOWN_USER } from "@/lib/types";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/components/ReportEntityDialog", () => ({
  ReportEntityDialog: () => null,
}));

const entry = toHazardMonsterView({
  id: "22222222-2222-2222-2222-222222222222",
  name: "Deletion fixture",
  hazard: true,
  level: "2",
  levelInt: 2,
  visibility: "private",
  creator: UNKNOWN_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  abilities: [],
  actions: [],
  actionPreface: "",
});
beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(window, "alert").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe.each([false, true])("delete UI hazard=%s", (hazard) => {
  const kind = hazard ? "hazard" : "monster";
  function show(isOwner = true) {
    render(
      <MonsterDetailActions monster={{ ...entry, hazard }} isOwner={isOwner} />
    );
  }
  it("uses stable JSON, disables pending deletion and navigates to the right owner list", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/deleteBestiaryEntry");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    expect(JSON.parse(String(options.body))).toEqual({ id: entry.id, kind });
    finish(Response.json({ success: true }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        hazard ? "/my/hazards" : "/my/monsters"
      )
    );
  });
  it.each([
    "http",
    "network",
  ])("shows one error and permits manual retry after %s failure", async (failure) => {
    const fetchMock = vi.fn();
    const message =
      failure === "http" ? "Bestiary entry not found" : "Failed to fetch";
    if (failure === "http")
      fetchMock.mockResolvedValue(
        Response.json({ error: message }, { status: 404 })
      );
    else fetchMock.mockRejectedValue(new TypeError(message));
    vi.stubGlobal("fetch", fetchMock);
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        `Error deleting ${kind}: ${message}`
      )
    );
    expect(window.alert).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled()
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(Response.json({ success: true }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  });
  it("does not send cancelled or non-owner deletes", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    show();
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();
    show(false);
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
