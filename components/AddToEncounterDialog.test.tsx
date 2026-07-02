import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockListOwnEncounters, mockAddMonsterToEncounter } = vi.hoisted(() => ({
  mockListOwnEncounters: vi.fn(),
  mockAddMonsterToEncounter: vi.fn(),
}));

vi.mock("@/app/actions/encounter", () => ({
  listOwnEncounters: mockListOwnEncounters,
  addMonsterToEncounter: mockAddMonsterToEncounter,
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
    mockListOwnEncounters.mockResolvedValue(ENCOUNTERS);
  });

  afterEach(cleanup);

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

  it("submits form with correct monsterId, encounterId, quantity, and isPerHero", async () => {
    mockAddMonsterToEncounter.mockResolvedValue({ success: true });
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

    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(mockAddMonsterToEncounter).toHaveBeenCalled();
    });

    const formData = mockAddMonsterToEncounter.mock.calls[0][0];
    expect(formData.get("monsterId")).toBe("m1");
    expect(formData.get("encounterId")).toBe("enc-2");
    expect(formData.get("quantity")).toBe("1");
    expect(formData.get("isPerHero")).toBe("false");
  });
});
