import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemDetailActions } from "@/app/items/ItemDetailActions";
import type { Item } from "@/lib/services/items";
import { UNKNOWN_USER } from "@/lib/types";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/components/ReportEntityDialog", () => ({
  ReportEntityDialog: () => null,
}));
const item: Item = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Deletion fixture",
  description: "Private QA item",
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

describe("item deletion client", () => {
  it("uses stable JSON without next-action, disables pending delete and navigates on success", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<ItemDetailActions item={item} isOwner />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/deleteItem");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    expect(JSON.parse(String(options.body))).toEqual({ id: item.id });
    finish(Response.json({ success: true }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/my/items"));
  });
  it.each(["http", "network"])(
    "retains the page, shows one error and allows manual retry after %s failure",
    async (failure) => {
      const fetchMock = vi.fn();
      const message = failure === "http" ? "Item not found" : "Failed to fetch";
      if (failure === "http")
        fetchMock.mockResolvedValue(
          Response.json({ error: message }, { status: 404 })
        );
      else fetchMock.mockRejectedValue(new TypeError(message));
      vi.stubGlobal("fetch", fetchMock);
      render(<ItemDetailActions item={item} isOwner />);
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          `Error deleting item: ${message}`
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
      await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/my/items"));
    }
  );
  it("does not request deletion on cancellation or show it to non-owners", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ItemDetailActions item={item} isOwner />);
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();
    render(<ItemDetailActions item={item} isOwner={false} />);
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
