import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntityReferencesLab } from "./EntityReferencesLab";
import type { ReferenceExample } from "./fixtures";

vi.mock("@/components/layout/ModeToggle", () => ({ ModeToggle: () => null }));
vi.mock("@/lib/hooks/useEntityQuery", () => ({
  useEntityQuery: (_type: string, id: string) => ({
    data:
      id === "0000000000000000000000000b" ||
      id === "00000000-0000-0000-0000-00000000000b"
        ? { id: "00000000-0000-0000-0000-00000000000b", name: "Public table" }
        : null,
    isLoading: false,
    isError: false,
  }),
}));

afterEach(async () => {
  await act(async () => {
    cleanup();
  });
});

const examples: ReferenceExample[] = [
  {
    key: "table",
    label: "Tables",
    type: "table",
    id: "00000000-0000-0000-0000-00000000000b",
    url: "https://nimble.nexus/tables/public-table-0000000000000000000000000b",
    available: true,
    privateId: "00000000-0000-0000-0000-00000000000c",
  },
];

describe("EntityReferencesLab", () => {
  it("compares the real interactive and noninteractive renderer with unresolved private references", async () => {
    const { container } = render(<EntityReferencesLab examples={examples} />);
    const interactive = container.querySelector(
      '[data-reference-panel="table"] [data-reference-mode="interactive"]'
    );
    const noninteractive = container.querySelector(
      '[data-reference-panel="table"] [data-reference-mode="noninteractive"]'
    );
    if (
      !(interactive instanceof HTMLElement) ||
      !(noninteractive instanceof HTMLElement)
    )
      throw new Error("Missing previews");
    expect(
      (await within(interactive).findAllByRole("link")).length
    ).toBeGreaterThan(10);
    expect(
      await within(noninteractive).findAllByText("Public table")
    ).not.toHaveLength(0);
    expect(within(noninteractive).queryByRole("link")).not.toBeInTheDocument();
    expect(
      within(interactive).queryByText("must not display")
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-reference-panel]")).toHaveLength(
      2
    );
  });

  it("shows exact editable syntax separately from rendered previews", () => {
    const { container } = render(<EntityReferencesLab examples={examples} />);
    expect(container.querySelector("pre")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Show source"));
    expect(
      container.querySelector('[data-reference-panel="table"] pre')
    ).toHaveTextContent("@table:[0000000000000000000000000b|custom label]");
    expect(container.querySelectorAll("pre")).toHaveLength(2);
  });
});
