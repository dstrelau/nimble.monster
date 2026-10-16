import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompanionDetailActions } from "@/app/companions/CompanionDetailActions";
import { type Companion, UNKNOWN_USER } from "@/lib/types";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/components/ReportEntityDialog", () => ({
  ReportEntityDialog: () => null,
}));
const companion: Companion = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Deletion fixture",
  kind: "Beast",
  class: "Ranger",
  hp_per_level: "4",
  wounds: 2,
  size: "small",
  saves: "DEX",
  actions: [],
  abilities: [],
  actionPreface: "",
  dyingRule: "",
  moreInfo: "",
  creator: UNKNOWN_USER,
  updatedAt: new Date(),
  visibility: "private",
};
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

describe("companion deletion client", () => {
  it("uses stable JSON without next-action, disables pending delete and navigates on success", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<CompanionDetailActions companion={companion} isOwner />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/deleteCompanion");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    expect(JSON.parse(String(options.body))).toEqual({ id: companion.id });
    finish(Response.json({ success: true }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my/companions")
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it.each([
    "http",
    "network",
  ])("retains the detail and allows manual retry after %s failure", async (failure) => {
    const fetchMock = vi.fn();
    const message =
      failure === "http" ? "Companion not found" : "Failed to fetch";
    if (failure === "http")
      fetchMock.mockResolvedValue(
        Response.json({ error: message }, { status: 404 })
      );
    else fetchMock.mockRejectedValue(new TypeError(message));
    vi.stubGlobal("fetch", fetchMock);
    render(<CompanionDetailActions companion={companion} isOwner />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        `Error deleting companion: ${message}`
      )
    );
    expect(window.alert).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled()
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(Response.json({ success: true }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my/companions")
    );
  });
  it("does not delete on cancellation or show deletion to non-owners", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<CompanionDetailActions companion={companion} isOwner />);
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();
    render(<CompanionDetailActions companion={companion} isOwner={false} />);
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
