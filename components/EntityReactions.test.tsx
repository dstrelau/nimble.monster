import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseSession } = vi.hoisted(() => ({ mockUseSession: vi.fn() }));
const { mockGetMyReactions, mockToggleMyReaction } = vi.hoisted(() => ({
  mockGetMyReactions: vi.fn(),
  mockToggleMyReaction: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ useSession: mockUseSession }));
vi.mock("@/app/actions/reactions", () => ({
  getMyReactions: mockGetMyReactions,
  toggleMyReaction: mockToggleMyReaction,
}));

import { EntityReactions } from "./EntityReactions";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  mockUseSession.mockReturnValue({ status: "authenticated" });
});

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe("EntityReactions", () => {
  it("renders nothing when unauthenticated", () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated" });

    const { container } = render(
      <EntityReactions entityType="monster" entityId="m1" />,
      { wrapper: createWrapper() }
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockGetMyReactions).not.toHaveBeenCalled();
  });

  it("shows only the icon when there are zero upvotes", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 0, thumbs_down: 0 },
      mine: [],
    });

    render(<EntityReactions entityType="monster" entityId="m1" />, {
      wrapper: createWrapper(),
    });

    const button = await screen.findByRole("button", { name: "Upvote" });
    expect(button).toHaveTextContent("");
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the count when not reacted but others have upvoted", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 2, thumbs_down: 0 },
      mine: [],
    });

    render(<EntityReactions entityType="item" entityId="i1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
        "2"
      );
    });
  });

  it("shows the amber active state with count when the user has upvoted", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 1, thumbs_down: 0 },
      mine: ["thumbs_up"],
    });

    render(<EntityReactions entityType="monster" entityId="m1" />, {
      wrapper: createWrapper(),
    });

    const button = await screen.findByRole("button", {
      name: "Remove upvote",
    });
    expect(button).toHaveTextContent("1");
  });

  it("toggles an upvote on click", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 0, thumbs_down: 0 },
      mine: [],
    });
    mockToggleMyReaction.mockResolvedValue({
      success: true,
      data: {
        counts: { thumbs_up: 1, thumbs_down: 0 },
        mine: ["thumbs_up"],
      },
    });

    render(<EntityReactions entityType="monster" entityId="m1" />, {
      wrapper: createWrapper(),
    });

    const button = await screen.findByRole("button", { name: "Upvote" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToggleMyReaction).toHaveBeenCalledWith(
        "monster",
        "m1",
        "thumbs_up"
      );
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Remove upvote" })
      ).toHaveTextContent("1");
    });
  });

  it("toggles an existing upvote off on click", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 1, thumbs_down: 0 },
      mine: ["thumbs_up"],
    });
    mockToggleMyReaction.mockResolvedValue({
      success: true,
      data: {
        counts: { thumbs_up: 0, thumbs_down: 0 },
        mine: [],
      },
    });

    render(<EntityReactions entityType="monster" entityId="m1" />, {
      wrapper: createWrapper(),
    });

    const button = await screen.findByRole("button", {
      name: "Remove upvote",
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToggleMyReaction).toHaveBeenCalledWith(
        "monster",
        "m1",
        "thumbs_up"
      );
    });
    await waitFor(() => {
      const upvoteButton = screen.getByRole("button", { name: "Upvote" });
      expect(upvoteButton).toHaveTextContent("");
    });
  });
});
