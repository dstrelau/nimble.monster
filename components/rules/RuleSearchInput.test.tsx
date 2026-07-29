import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPush, mockFetch } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { RuleSearchInput } from "./RuleSearchInput";

describe("RuleSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("debounces searches and shows inline results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            slug: "skills",
            title: "Finesse (DEX)",
            category: "core-rules",
            anchor: "finesse-dex",
            excerpt: "Use <mark>Finesse</mark> for careful movement.",
          },
        ],
      }),
    });
    render(<RuleSearchInput />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Finesse" },
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Searching")).toBeInTheDocument();
    expect(document.querySelector("[cmdk-root]")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(mockFetch).toHaveBeenCalledWith("/rules/search?q=Finesse");
    const result = screen.getByText("Finesse (DEX)");
    expect(result).toBeInTheDocument();
    expect(result.closest("[cmdk-root]")).toHaveClass("h-auto");
    expect(screen.getByText("Core Rules")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not open a dropdown when there are no results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    render(<RuleSearchInput />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "zzzz-no-rule" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(document.querySelector("[cmdk-root]")).toBeNull();
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("opens the selected result at its section anchor", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            slug: "skills",
            title: "Finesse (DEX)",
            category: "core-rules",
            anchor: "finesse-dex",
            excerpt: "Careful movement.",
          },
        ],
      }),
    });
    render(<RuleSearchInput defaultValue="Finesse" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fireEvent.click(screen.getByText("Finesse (DEX)"));

    expect(mockPush).toHaveBeenCalledWith("/rules/skills#finesse-dex");
  });
});
