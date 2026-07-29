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
            title: "Skills",
            category: "fundamentals",
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

    expect(mockFetch).toHaveBeenCalledWith("/rules/search?q=Finesse", {
      signal: expect.anything(),
    });
    const result = screen.getByText("Skills");
    expect(result).toBeInTheDocument();
    expect(result.closest("[cmdk-root]")).toHaveClass("h-auto");
    expect(screen.getByText("Fundamentals")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("aborts a request when the query changes", async () => {
    mockFetch.mockReturnValue(new Promise(() => undefined));
    render(<RuleSearchInput />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "first" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    const signal = mockFetch.mock.calls[0][1].signal;

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "second" },
    });

    expect(signal.aborted).toBe(true);
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

  it("labels and opens an official FAQ result", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            slug: "defend",
            title: "Can you Defend against Warding Bond?",
            category: "combat",
            faqKind: "official",
            anchor: "faq-warding-bond",
          },
        ],
      }),
    });
    render(<RuleSearchInput defaultValue="Warding Bond" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(screen.getByText("FAQ · Official")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Can you Defend against Warding Bond?"));

    expect(mockPush).toHaveBeenCalledWith("/rules/defend#faq-warding-bond");
  });

  it("includes and marks homebrew results when toggled on", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            slug: "custom-rule-id",
            title: "Heroic Initiative",
            category: "custom",
            href: "/custom-rules/heroic-initiative_abc123",
            customRule: true,
          },
        ],
      }),
    });
    render(<RuleSearchInput defaultValue="popcorn" />);
    fireEvent.click(screen.getByRole("button", { name: "Include Homebrew" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/rules/search?q=popcorn&includeHomebrew=true",
      { signal: expect.anything() }
    );
    expect(screen.getByLabelText("Homebrew")).toBeInTheDocument();
    expect(screen.queryByText("Custom rule")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Heroic Initiative"));

    expect(mockPush).toHaveBeenCalledWith(
      "/custom-rules/heroic-initiative_abc123"
    );
  });
});
