import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AncestryDetailActions } from "@/app/ancestries/AncestryDetailActions";
import type { Ancestry } from "@/lib/services/ancestries";
import { UNKNOWN_USER } from "@/lib/types";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/components/ReportEntityDialog", () => ({
  ReportEntityDialog: () => null,
}));
const ancestry: Ancestry = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Deletion fixture",
  description: "Private QA ancestry",
  abilities: [],
  size: ["medium"],
  rarity: "common",
  visibility: "private",
  creator: UNKNOWN_USER,
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe("ancestry deletion client", () => {
  it("uses stable JSON without next-action, disables pending delete and navigates on success", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<AncestryDetailActions ancestry={ancestry} isOwner />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/deleteAncestry");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    expect(JSON.parse(String(options.body))).toEqual({ id: ancestry.id });
    finish(Response.json({ success: true }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my/ancestries")
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it.each(["http", "network"])(
    "retains the page, shows one error and allows manual retry after %s failure",
    async (failure) => {
      const fetchMock = vi.fn();
      const message =
        failure === "http" ? "Ancestry not found" : "Failed to fetch";
      if (failure === "http")
        fetchMock.mockResolvedValue(
          Response.json({ error: message }, { status: 404 })
        );
      else fetchMock.mockRejectedValue(new TypeError(message));
      vi.stubGlobal("fetch", fetchMock);
      render(<AncestryDetailActions ancestry={ancestry} isOwner />);
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          `Error deleting ancestry: ${message}`
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
        expect(mocks.push).toHaveBeenCalledWith("/my/ancestries")
      );
    }
  );
  it("does not request deletion on cancellation or show it to non-owners", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AncestryDetailActions ancestry={ancestry} isOwner />);
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();
    render(<AncestryDetailActions ancestry={ancestry} isOwner={false} />);
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
