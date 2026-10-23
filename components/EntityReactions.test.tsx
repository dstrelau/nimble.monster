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
const { mockGetMyReactions } = vi.hoisted(() => ({
  mockGetMyReactions: vi.fn(),
}));
const mockFetch = vi.fn<typeof fetch>();

vi.mock("next-auth/react", () => ({ useSession: mockUseSession }));
vi.mock("@/app/actions/reactions", () => ({
  getMyReactions: mockGetMyReactions,
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
  vi.stubGlobal("fetch", mockFetch);
  mockUseSession.mockReturnValue({ status: "authenticated" });
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
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
    mockFetch.mockResolvedValue(
      Response.json({
        success: true,
        data: {
          counts: { thumbs_up: 1, thumbs_down: 0 },
          mine: ["thumbs_up"],
        },
      })
    );

    render(<EntityReactions entityType="monster" entityId="m1" />, {
      wrapper: createWrapper(),
    });

    const button = await screen.findByRole("button", { name: "Upvote" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/_actions/toggleReaction", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "monster",
          entityId: "m1",
          reactionType: "thumbs_up",
        }),
      });
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
    mockFetch.mockResolvedValue(
      Response.json({
        success: true,
        data: {
          counts: { thumbs_up: 0, thumbs_down: 0 },
          mine: [],
        },
      })
    );

    render(<EntityReactions entityType="monster" entityId="m1" />, {
      wrapper: createWrapper(),
    });

    const button = await screen.findByRole("button", {
      name: "Remove upvote",
    });
    fireEvent.click(button);

    await waitFor(() => {
      const upvoteButton = screen.getByRole("button", { name: "Upvote" });
      expect(upvoteButton).toHaveTextContent("");
    });
  });

  it("renders a labeled button when requested", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 2, thumbs_down: 0 },
      mine: [],
    });

    render(
      <EntityReactions entityType="customRule" entityId="rule-1" showLabel />,
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Like" })).toHaveTextContent(
        "Like 2"
      )
    );
  });

  it("keeps the previous count after failure and permits a manual retry", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 2, thumbs_down: 0 },
      mine: [],
    });
    mockFetch.mockResolvedValueOnce(
      Response.json({ error: "Internal Server Error" }, { status: 500 })
    );
    mockFetch.mockResolvedValueOnce(
      Response.json({
        success: true,
        data: { counts: { thumbs_up: 3, thumbs_down: 0 }, mine: ["thumbs_up"] },
      })
    );
    render(<EntityReactions entityType="item" entityId="i1" />, {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
        "2"
      )
    );
    fireEvent.click(screen.getByRole("button", { name: "Upvote" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
      "2"
    );
    fireEvent.click(screen.getByRole("button", { name: "Upvote" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Remove upvote" })
      ).toHaveTextContent("3")
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
