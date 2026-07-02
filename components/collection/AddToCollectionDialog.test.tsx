import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockListOwnCollections, mockAddCompanionToCollection } = vi.hoisted(
  () => ({
    mockListOwnCollections: vi.fn(),
    mockAddCompanionToCollection: vi.fn(),
  })
);

vi.mock("@/app/actions/collection", () => ({
  listOwnCollections: mockListOwnCollections,
  addMonsterToCollection: vi.fn(),
  addItemToCollection: vi.fn(),
  addSpellSchoolToCollection: vi.fn(),
  addCompanionToCollection: mockAddCompanionToCollection,
  addAncestryToCollection: vi.fn(),
  addBackgroundToCollection: vi.fn(),
  addSubclassToCollection: vi.fn(),
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
      data-testid="collection-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">Select a collection</option>
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

import { AddToCollectionDialog } from "./AddToCollectionDialog";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const COLLECTIONS = {
  success: true,
  collections: [
    {
      id: "col-1",
      name: "My Monsters",
      monsters: [{ id: "m-existing" }],
      items: [],
      companions: [],
      ancestries: [],
      backgrounds: [],
      subclasses: [],
      spellSchools: [],
    },
    {
      id: "col-2",
      name: "Empty Collection",
      monsters: [],
      items: [],
      companions: [],
      ancestries: [],
      backgrounds: [],
      subclasses: [],
      spellSchools: [],
    },
  ],
};

describe("AddToCollectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListOwnCollections.mockResolvedValue(COLLECTIONS);
  });

  afterEach(cleanup);

  it("renders the trigger button", () => {
    render(<AddToCollectionDialog type="monster" monsterId="m1" />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.getByRole("button", { name: /add to collection/i })
    ).toBeInTheDocument();
  });

  it("opens dialog with select and submit button", async () => {
    render(<AddToCollectionDialog type="monster" monsterId="m1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));

    await waitFor(() => {
      expect(screen.getByTestId("collection-select")).toBeInTheDocument();
    });

    // Dialog title should be visible (there are two "Add to Collection" texts: trigger + title)
    expect(screen.getAllByText("Add to Collection")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  });

  it("shows 'already in collection' warning for duplicate", async () => {
    render(<AddToCollectionDialog type="monster" monsterId="m-existing" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));

    await waitFor(() => {
      expect(screen.getByTestId("collection-select")).toBeInTheDocument();
    });

    // Wait for collections to load, then select one with the existing monster
    await waitFor(() => {
      expect(screen.getByText("My Monsters")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("collection-select"), {
      target: { value: "col-1" },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/already in the selected collection/)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled();
  });

  it("submits form with correct entity type and collection", async () => {
    mockAddCompanionToCollection.mockResolvedValue({ success: true });
    render(<AddToCollectionDialog type="companion" companionId="comp-1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));

    await waitFor(() => {
      expect(screen.getByTestId("collection-select")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Empty Collection")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("collection-select"), {
      target: { value: "col-2" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(mockAddCompanionToCollection).toHaveBeenCalled();
    });

    const formData = mockAddCompanionToCollection.mock.calls[0][0] as FormData;
    expect(formData.get("companionId")).toBe("comp-1");
    expect(formData.get("collectionId")).toBe("col-2");
  });
});
