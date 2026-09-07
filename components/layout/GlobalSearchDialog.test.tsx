import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalSearchDialog } from "./GlobalSearchDialog";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/components/paperforge/PaperforgeImage", () => ({
  PaperforgeImage: ({ id }: { id: string }) => (
    <div data-testid={`paperforge-${id}`} />
  ),
}));

vi.mock("@/components/icons/GameIcon", () => ({
  GameIcon: ({ iconId }: { iconId: string }) => (
    <div data-testid={`game-icon-${iconId}`} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("GlobalSearchDialog", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("opens with Ctrl-K and Meta-K and closes with Escape", async () => {
    render(<GlobalSearchDialog />);

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Bestiary")).toBeInTheDocument();
    expect(screen.getByText("Heroes")).toBeInTheDocument();
    expect(screen.getByText("Collections")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByPlaceholderText("Search"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByPlaceholderText("Search"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("aborts stale searches and sends the latest query", async () => {
    vi.useFakeTimers();
    const resolvers: ((response: Response) => void)[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        })
    );
    render(<GlobalSearchDialog />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    const input = screen.getByPlaceholderText("Search");

    fireEvent.change(input, { target: { value: "first" } });
    act(() => {
      vi.advanceTimersByTime(225);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "second" } });
    act(() => {
      vi.advanceTimersByTime(225);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(vi.mocked(fetch).mock.calls[1]?.[0])).toContain("q=second");

    await act(async () => {
      resolvers[0]?.(
        Response.json({
          results: [
            {
              type: "monster",
              id: "stale",
              name: "Stale result",
              href: "/stale",
            },
          ],
        })
      );
      resolvers[1]?.(
        Response.json({
          results: [
            {
              type: "monster",
              id: "fresh",
              name: "Fresh result",
              href: "/fresh",
            },
          ],
        })
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Fresh result")).toBeInTheDocument();
    expect(screen.queryByText("Stale result")).toBeNull();
    fireEvent.click(screen.getByText("Fresh result"));
    expect(mockPush).toHaveBeenCalledWith("/fresh");
  });

  it("selects and clears a type filter and loads its recent results", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        results: [
          {
            type: "monster",
            id: "recent-monster",
            name: "Recent Monster",
            href: "/monsters/recent-monster",
            creator: { id: "creator-1", name: "Nimble Co." },
          },
        ],
      })
    );
    render(<GlobalSearchDialog />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    fireEvent.click(screen.getByText("Monsters"));
    expect(screen.getByPlaceholderText("Search Monsters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear Monsters filter" })
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(225);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain(
      "type=monster"
    );
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("limit=12");
    expect(screen.getByText("Recent Monster")).toBeInTheDocument();
    expect(screen.getByText("Nimble Co.")).toBeInTheDocument();
    expect(screen.queryByText("Monsters · Nimble Co.")).toBeNull();
    expect(
      [...document.querySelectorAll("[cmdk-group-heading]")].map(
        (heading) => heading.textContent
      )
    ).toEqual(["Monsters"]);

    fireEvent.click(
      screen.getByRole("button", { name: "Clear Monsters filter" })
    );
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Bestiary")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Collections"));
    expect(
      screen.getByPlaceholderText("Search Collections")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear Collections filter" })
    ).toBeInTheDocument();
  });

  it("groups results by type and renders available entity images", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        results: [
          {
            type: "monster",
            id: "monster-1",
            name: "Frost Wyrm",
            href: "/monsters/frost-wyrm-1",
            paperforgeId: "5",
          },
          {
            type: "item",
            id: "item-1",
            name: "Frost Wand",
            href: "/items/frost-wand-1",
            imageIcon: "emerald",
          },
        ],
      })
    );
    render(<GlobalSearchDialog />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "frost" },
    });

    await act(async () => {
      vi.advanceTimersByTime(225);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      document.querySelector("[cmdk-group-heading][id]")?.textContent
    ).toBe("Monsters");
    expect(
      [...document.querySelectorAll("[cmdk-group-heading]")].map(
        (heading) => heading.textContent
      )
    ).toEqual(["Monsters", "Items"]);
    expect(screen.getByTestId("paperforge-5")).toBeInTheDocument();
    expect(screen.getByTestId("game-icon-emerald")).toBeInTheDocument();
  });
});
