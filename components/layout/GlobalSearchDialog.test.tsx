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

vi.mock("@/components/shared/CreatorCombobox", () => ({
  CreatorCombobox: ({
    onChange,
  }: {
    onChange: (creatorId: string | null) => void;
  }) => (
    <button type="button" onClick={() => onChange("creator-1")}>
      All Creators
    </button>
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
    expect(
      screen.getByPlaceholderText("Search monsters, rules, items...")
    ).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByPlaceholderText("Search monsters, rules, items..."),
      { key: "Escape" }
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(
      screen.getByPlaceholderText("Search monsters, rules, items..."),
      { key: "Escape" }
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("aborts stale searches and sends selected filter parameters", async () => {
    vi.useFakeTimers();
    const resolvers: ((response: Response) => void)[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        })
    );
    render(<GlobalSearchDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Global search" }));
    const input = screen.getByPlaceholderText(
      "Search monsters, rules, items..."
    );

    fireEvent.change(input, { target: { value: "first" } });
    act(() => {
      vi.advanceTimersByTime(225);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Filter by type" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Monsters" }));
    fireEvent.change(input, { target: { value: "second" } });
    act(() => {
      vi.advanceTimersByTime(225);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(vi.mocked(fetch).mock.calls[1]?.[0])).toContain(
      "types=monster"
    );

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

  it("sends both type and creator filters", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ results: [] })
    );
    render(<GlobalSearchDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Global search" }));
    fireEvent.click(screen.getByRole("button", { name: "Filter by type" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Monsters" }));
    fireEvent.click(screen.getByRole("button", { name: "All Creators" }));
    fireEvent.change(
      screen.getByPlaceholderText("Search monsters, rules, items..."),
      { target: { value: "frost" } }
    );

    await act(async () => {
      vi.advanceTimersByTime(225);
      await Promise.resolve();
    });

    const [url] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(String(url)).toContain("types=monster");
    expect(String(url)).toContain("creatorId=creator-1");
  });
});
