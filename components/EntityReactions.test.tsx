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

import { EntityReactions } from "./EntityReactions";
import { ReactionsBatch } from "./ReactionsBatch";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options: RequestInit) => {
      if (url.startsWith("/_actions/getMyReactions?")) {
        return mockGetMyReactions().then((summary: unknown) =>
          Response.json(summary)
        );
      }
      return mockFetch(url, options);
    })
  );
  mockUseSession.mockReturnValue({
    status: "authenticated",
    data: { user: { id: "user-1" } },
  });
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe("EntityReactions", () => {
  it("uses a bodyless stable GET with cancellation and no identity or next-action", async () => {
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 2, thumbs_down: 0 },
      mine: [],
    });
    render(<EntityReactions entityType="item" entityId="i1" />, {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
        "2"
      )
    );
    expect(fetch).toHaveBeenCalledWith(
      "/_actions/getMyReactions?entityType=item&entityId=i1",
      {
        method: "GET",
        credentials: "same-origin",
        signal: expect.any(AbortSignal),
      }
    );
  });

  it("isolates fresh cached reads and an in-flight mutation across account changes", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 2, thumbs_down: 0 },
      mine: ["thumbs_up"],
    });
    const { container, rerender } = render(
      <EntityReactions entityType="item" entityId="i1" likeCount={5} />,
      { wrapper }
    );
    await screen.findByRole("button", { name: "Remove upvote" });
    let resolveMutation: (response: Response) => void = () => {
      throw new Error("Mutation not started");
    };
    mockFetch.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveMutation = resolve;
        })
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove upvote" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "user-2" } },
    });
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 2, thumbs_down: 0 },
      mine: [],
    });
    rerender(<EntityReactions entityType="item" entityId="i1" likeCount={5} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
        "2"
      )
    );
    resolveMutation(
      Response.json({
        success: true,
        data: { counts: { thumbs_up: 1, thumbs_down: 0 }, mine: [] },
      })
    );
    await waitFor(() =>
      expect(
        client.getQueryData(["reactions", "item", "i1", "user-1"])
      ).toEqual({ counts: { thumbs_up: 1, thumbs_down: 0 }, mine: [] })
    );
    expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
      "2"
    );
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
    rerender(<EntityReactions entityType="item" entityId="i1" likeCount={5} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container).toHaveTextContent("5 likes");
    client.clear();
  });

  it("preserves the fallback during pending/error reads and recovers on refetch", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    let fail: (error: Error) => void = () => {
      throw new Error("Read not started");
    };
    mockGetMyReactions.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        })
    );
    render(<EntityReactions entityType="item" entityId="i1" />, { wrapper });
    expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
      ""
    );
    fail(new Error("Network failure"));
    await waitFor(() =>
      expect(
        client.getQueryState(["reactions", "item", "i1", "user-1"])?.status
      ).toBe("error")
    );
    expect(screen.getByRole("button", { name: "Upvote" })).toHaveTextContent(
      ""
    );
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 4, thumbs_down: 0 },
      mine: ["thumbs_up"],
    });
    await client.refetchQueries();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Remove upvote" })
      ).toHaveTextContent("4")
    );
    client.clear();
  });

  it.each([
    { showLabel: false, likeCount: 7, text: "7 likes" },
    { showLabel: true, likeCount: 1, text: "1 like" },
    { showLabel: true, likeCount: 0, text: "0 likes" },
  ])(
    "shows $text as a read-only count for guests",
    ({ showLabel, likeCount, text }) => {
      mockUseSession.mockReturnValue({ status: "unauthenticated" });

      const { container } = render(
        <EntityReactions
          entityType="monster"
          entityId="m1"
          likeCount={likeCount}
          showLabel={showLabel}
        />,
        { wrapper: createWrapper() }
      );

      expect(container).toHaveTextContent(text);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    }
  );

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

describe("EntityReactions inside ReactionsBatch", () => {
  it("loads batched cards with one request and leaves other cards alone", async () => {
    const batched = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ];
    let resolveBatch: (response: Response) => void = () => {
      throw new Error("Batch not started");
    };
    mockFetch.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveBatch = resolve;
        })
    );
    mockGetMyReactions.mockResolvedValue({
      counts: { thumbs_up: 9, thumbs_down: 0 },
      mine: [],
    });
    render(
      <ReactionsBatch pages={[{ entityType: "monster", ids: batched }]}>
        <EntityReactions
          entityType="monster"
          entityId={batched[0]}
          likeCount={3}
        />
        <EntityReactions entityType="monster" entityId={batched[1]} />
        <EntityReactions entityType="item" entityId={batched[0]} />
      </ReactionsBatch>,
      { wrapper: createWrapper() }
    );

    // The stored count shows while the batch is in flight.
    const [first, second, unbatched] = screen.getAllByRole("button");
    expect(first).toHaveTextContent("3");
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch).toHaveBeenCalledWith(
      `/_actions/getMyReactionsBatch?entityType=monster&entityIds=${batched.join("%2C")}`,
      expect.objectContaining({ method: "GET" })
    );

    resolveBatch(
      Response.json({
        [batched[0]]: {
          counts: { thumbs_up: 4, thumbs_down: 0 },
          mine: ["thumbs_up"],
        },
        [batched[1]]: { counts: { thumbs_up: 1, thumbs_down: 0 }, mine: [] },
      })
    );
    await waitFor(() => expect(first).toHaveAccessibleName("Remove upvote"));
    expect(first).toHaveTextContent("4");
    expect(second).toHaveAccessibleName("Upvote");
    expect(second).toHaveTextContent("1");

    // An item with the same ID is not in the monster batch, so it fetches alone.
    await waitFor(() => expect(unbatched).toHaveTextContent("9"));
    expect(mockGetMyReactions).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
