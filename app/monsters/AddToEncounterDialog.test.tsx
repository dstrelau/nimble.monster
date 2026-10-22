import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockListOwnEncounters, mockFetch } = vi.hoisted(() => ({
  mockListOwnEncounters: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/app/actions/encounter", () => ({
  listOwnEncounters: mockListOwnEncounters,
}));

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
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue(Response.json({ success: true }));
    mockListOwnEncounters.mockResolvedValue(ENCOUNTERS);
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
    expect(mockListOwnEncounters).toHaveBeenCalledTimes(2);
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
});
