import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyHeader } from "@/app/families/FamilyHeader";
import { type FamilyOverview, UNKNOWN_USER } from "@/lib/types";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

const family: FamilyOverview = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Deletion fixture",
  abilities: [],
  monsterCount: 0,
  visibility: "public",
  creatorId: UNKNOWN_USER.discordId,
  creator: UNKNOWN_USER,
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

describe("family deletion client", () => {
  it("uses stable JSON without next-action, disables pending delete and navigates on success", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<FamilyHeader family={family} showEditDeleteButtons />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/_actions/deleteFamily");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    expect(JSON.parse(String(options.body))).toEqual({ id: family.id });
    finish(Response.json({ success: true }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my/families")
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it.each([
    "http",
    "network",
  ])("retains the detail and allows manual retry after %s failure", async (failure) => {
    const fetchMock = vi.fn();
    if (failure === "http")
      fetchMock.mockResolvedValue(
        Response.json({ error: "Family not found" }, { status: 404 })
      );
    else fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    render(<FamilyHeader family={family} showEditDeleteButtons />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to delete family. Please try again."
      )
    );
    expect(window.alert).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(Response.json({ success: true }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my/families")
    );
  });
  it("does not delete on cancellation or show deletion to non-owners", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<FamilyHeader family={family} showEditDeleteButtons />);
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();
    render(<FamilyHeader family={family} />);
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
