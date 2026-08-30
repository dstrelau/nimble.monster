import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/shared/FormattedText", () => ({
  FormattedText: ({ content }: { content: string }) => <span>{content}</span>,
}));

import { SubtableView } from "./SubtableView";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const subtable = {
  title: "Encounter Difficulty",
  notation: "2d12",
  rows: [
    { low: 2, high: 2, result: "Very Deadly" },
    { low: 3, high: 8, result: "Easy" },
    { low: 24, high: 24, result: "Deadly" },
  ],
};

describe("SubtableView", () => {
  it("renders the title with its dice notation", () => {
    render(<SubtableView subtable={subtable} conditions={[]} />);
    expect(screen.getByText("Encounter Difficulty")).toBeInTheDocument();
    expect(screen.getByText("[2d12]")).toBeInTheDocument();
  });

  it("shows a single value for a one-value row and a range for a combined row", () => {
    render(<SubtableView subtable={subtable} conditions={[]} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3-8")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("renders each row's result", () => {
    render(<SubtableView subtable={subtable} conditions={[]} />);
    expect(screen.getByText("Very Deadly")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Deadly")).toBeInTheDocument();
  });
});
