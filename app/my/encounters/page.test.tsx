import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EncountersListViewProps } from "@/components/encounter/EncountersListView";

const { mockAuth, mockPrefetchInfiniteQuery } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrefetchInfiniteQuery: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/lib/queryClient", () => ({
  getQueryClient: () => ({ prefetchInfiniteQuery: mockPrefetchInfiniteQuery }),
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  dehydrate: () => ({}),
  HydrationBoundary: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/encounter/EncountersListView", () => ({
  EncountersListView: (props: EncountersListViewProps) => (
    <div data-testid="encounters-list-view" data-kind={props.kind} />
  ),
}));

import MyEncountersPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MyEncountersPage", () => {
  it("renders the shared filterable list view scoped to the current user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", discordId: "d1" } });

    render(await MyEncountersPage());

    expect(mockPrefetchInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["my-encounters", expect.anything()],
      })
    );
    expect(screen.getByTestId("encounters-list-view")).toHaveAttribute(
      "data-kind",
      "my-encounters"
    );
  });
});
