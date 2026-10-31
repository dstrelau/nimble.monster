import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRead, mockFetch, mockSession } = vi.hoisted(() => ({
  mockRead: vi.fn(),
  mockFetch: vi.fn(),
  mockSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ useSession: mockSession }));

// Mock shadcn Select to use a plain HTML select (Radix portals don't work in jsdom)
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange: (v: string) => void;
    value: string;
  }) => (
    <select
      data-testid="encounter-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">Select an encounter</option>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

import { AddToEncounterDialog } from "./AddToEncounterDialog";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const ENCOUNTERS = {
  success: true,
  encounters: [
    {
      id: "enc-1",
      name: "Goblin Ambush",
      monsters: [{ monster: { id: "m-existing" } }],
    },
    {
      id: "enc-2",
      name: "Empty Encounter",
      monsters: [],
    },
  ],
};

describe("AddToEncounterDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "owner" } },
    });
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) =>
      url === "/_actions/listOwnEncounters"
        ? mockRead(url, init)
        : mockFetch(url, init)
    );
    mockFetch.mockResolvedValue(Response.json({ success: true }));
    mockRead.mockImplementation(async () => Response.json(ENCOUNTERS));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the trigger button", () => {
    render(<AddToEncounterDialog monsterId="m1" />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /add to encounter/i })
    ).toBeInTheDocument();
  });

  it("opens dialog with select and submit button", async () => {
    render(<AddToEncounterDialog monsterId="m1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));

    await waitFor(() => {
      expect(screen.getByTestId("encounter-select")).toBeInTheDocument();
    });

    // There are two "Add to Encounter" texts: trigger + dialog title
    expect(screen.getAllByText("Add to Encounter")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  });

  it("lists the user's own encounters", async () => {
    render(<AddToEncounterDialog monsterId="m1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));

    await waitFor(() => {
      expect(screen.getByText("Goblin Ambush")).toBeInTheDocument();
    });
    expect(screen.getByText("Empty Encounter")).toBeInTheDocument();
  });

  it("relabels submit and warns when monster already in encounter", async () => {
    render(<AddToEncounterDialog monsterId="m-existing" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));

    await waitFor(() => {
      expect(screen.getByTestId("encounter-select")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Goblin Ambush")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("encounter-select"), {
      target: { value: "enc-1" },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/already in the selected encounter/)
      ).toBeInTheDocument();
    });

    // The button is relabeled (not disabled) when the monster already exists
    const submit = screen.getByRole("button", { name: /update quantity/i });
    expect(submit).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /^add$/i })
    ).not.toBeInTheDocument();
  });

  it("submits counts through stable JSON transport without next-action", async () => {
    render(<AddToEncounterDialog monsterId="m1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));

    await waitFor(() => {
      expect(screen.getByTestId("encounter-select")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Empty Encounter")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("encounter-select"), {
      target: { value: "enc-2" },
    });

    fireEvent.click(screen.getByRole("radio", { name: "Per hero" }));
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Monster count" }),
      {
        target: { value: "3" },
      }
    );
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Heroes per monster" }),
      {
        target: { value: "4" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    expect(mockFetch).toHaveBeenCalledWith("/_actions/addMonsterToEncounter", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encounterId: "enc-2",
        monsterId: "m1",
        quantity: 3,
        isPerHero: true,
        heroesPerMonster: 4,
      }),
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      await screen.findByRole("button", { name: /add to encounter/i })
    ).toBeVisible();
  });

  it("does not offer per-hero counts for legendary monsters", async () => {
    render(<AddToEncounterDialog monsterId="m1" legendary />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));

    await waitFor(() => {
      expect(screen.getByTestId("encounter-select")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /per hero/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("keeps the dialog and selection open when private content cannot be added", async () => {
    const error =
      "Public encounters cannot contain private monsters or hazards.";
    mockFetch.mockResolvedValueOnce(Response.json({ error }, { status: 400 }));
    render(<AddToEncounterDialog monsterId="m1" />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    await screen.findByText("Empty Encounter");
    fireEvent.change(screen.getByTestId("encounter-select"), {
      target: { value: "enc-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(error);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByTestId("encounter-select")).toHaveValue("enc-2");
  });

  it("retains counts while pending and after network failure, then permits manual retry", async () => {
    let rejectRequest: (error: Error) => void = () => {};
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((_resolve, reject) => {
        rejectRequest = reject;
      })
    );
    render(<AddToEncounterDialog monsterId="m1" />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    await screen.findByText("Empty Encounter");
    fireEvent.change(screen.getByTestId("encounter-select"), {
      target: { value: "enc-2" },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(
      await screen.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    rejectRequest(new Error("Failed to fetch"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to fetch"
    );
    expect(screen.getByTestId("encounter-select")).toHaveValue("enc-2");
    expect(screen.getByRole("spinbutton")).toHaveValue(3);
    expect(mockFetch).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mockFetch.mock.calls[1][1].body).quantity).toBe(3);
  });

  it("reads a bodyless stable URL without next-action and revives overview and monster dates", async () => {
    const { ownEncountersQueryOptions } = await import(
      "@/app/encounters/ownEncountersQueryOptions"
    );
    const date = "2026-09-01T12:00:00.000Z";
    mockRead.mockImplementation(async () =>
      Response.json({
        success: true,
        encounters: [
          {
            ...ENCOUNTERS.encounters[0],
            createdAt: date,
            monsters: [
              {
                monster: { id: "m-existing", createdAt: date },
                quantity: 3,
                isPerHero: true,
                heroesPerMonster: 4,
              },
            ],
          },
        ],
      })
    );
    const controller = new AbortController();
    const result = await ownEncountersQueryOptions("owner").queryFn({
      signal: controller.signal,
    });
    const [url, init] = mockRead.mock.calls[0];
    const request = new Request(new URL(url, "https://nimble.nexus"), init);
    expect(request.url).toBe("https://nimble.nexus/_actions/listOwnEncounters");
    expect(request.method).toBe("GET");
    expect(await request.text()).toBe("");
    expect(request.headers.has("next-action")).toBe(false);
    expect(init.signal).toBe(controller.signal);
    expect(result.encounters[0].createdAt).toEqual(new Date(date));
    expect(result.encounters[0].monsters[0].monster.createdAt).toEqual(
      new Date(date)
    );
    expect(result.encounters[0].monsters[0]).toMatchObject({
      quantity: 3,
      isPerHero: true,
      heroesPerMonster: 4,
    });
  });

  it("isolates accounts, cancels old reads and discards selection on account changes/sign-out", async () => {
    const wrapper = createWrapper();
    const view = render(<AddToEncounterDialog monsterId="m1" />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    await screen.findByText("Empty Encounter");
    fireEvent.change(screen.getByTestId("encounter-select"), {
      target: { value: "enc-2" },
    });
    mockRead.mockImplementation(() => new Promise(() => {}));
    mockSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "other" } },
    });
    view.rerender(<AddToEncounterDialog monsterId="m1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    expect(screen.queryByText("Empty Encounter")).not.toBeInTheDocument();
    expect(screen.getByTestId("encounter-select")).toHaveValue("");
    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
    const signal = mockRead.mock.calls[1][1].signal;
    mockSession.mockReturnValue({ status: "unauthenticated", data: null });
    view.rerender(<AddToEncounterDialog monsterId="m1" />);
    expect(
      screen.queryByRole("button", { name: /add to encounter/i })
    ).not.toBeInTheDocument();
    expect(signal.aborted).toBe(true);
    expect(mockRead).toHaveBeenCalledTimes(2);
  });

  it("retains options after a failed background read and recovers on retry", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <AddToEncounterDialog monsterId="m1" />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    await screen.findByText("Empty Encounter");
    mockRead.mockRejectedValue(new Error("offline"));
    await client.refetchQueries({ queryKey: ["listOwnEncounters", "owner"] });
    expect(screen.getByText("Empty Encounter")).toBeInTheDocument();
    mockRead.mockImplementation(async () =>
      Response.json({
        success: true,
        encounters: [{ id: "new", name: "Recovered encounter", monsters: [] }],
      })
    );
    await client.refetchQueries({ queryKey: ["listOwnEncounters", "owner"] });
    expect(await screen.findByText("Recovered encounter")).toBeInTheDocument();
    expect(screen.queryByText("Empty Encounter")).not.toBeInTheDocument();
  });

  it("does not relabel an old account's pending mutation or invalidate the new account's options", async () => {
    let resolve: (response: Response) => void = () => {};
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((r) => {
        resolve = r;
      })
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const view = render(
      <QueryClientProvider client={client}>
        <AddToEncounterDialog monsterId="m1" />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    await screen.findByText("Empty Encounter");
    fireEvent.change(screen.getByTestId("encounter-select"), {
      target: { value: "enc-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(
      await screen.findByRole("button", { name: "Saving..." })
    ).toBeDisabled();
    mockSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "other" } },
    });
    mockRead.mockImplementation(async () =>
      Response.json({
        success: true,
        encounters: [
          { id: "foreign", name: "Other account encounter", monsters: [] },
        ],
      })
    );
    view.rerender(
      <QueryClientProvider client={client}>
        <AddToEncounterDialog monsterId="m1" />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /add to encounter/i }));
    await screen.findByText("Other account encounter");
    resolve(Response.json({ success: true }));
    await waitFor(() =>
      expect(
        client.getQueryState(["listOwnEncounters", "owner"])?.isInvalidated
      ).toBe(true)
    );
    expect(
      client.getQueryState(["listOwnEncounters", "other"])?.isInvalidated
    ).toBe(false);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByTestId("encounter-select")).toHaveValue("");
    expect(screen.queryByText("Empty Encounter")).not.toBeInTheDocument();
  });
});
