import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockListOwnCollections, mockFetch } = vi.hoisted(() => ({
  mockListOwnCollections: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/app/actions/collection", () => ({
  listOwnCollections: mockListOwnCollections,
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
      items: [{ id: "i-existing" }],
      companions: [{ id: "c-existing" }],
      ancestries: [{ id: "a-existing" }],
      backgrounds: [],
      subclasses: [],
      spellSchools: [{ id: "s-existing" }],
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
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue(Response.json({ success: true }));
    mockListOwnCollections.mockResolvedValue(COLLECTIONS);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

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

  it.each<"hazard" | "item" | "spellSchool" | "companion" | "ancestry">([
    "hazard",
    "item",
    "spellSchool",
    "companion",
    "ancestry",
  ])("detects a duplicate %s", async (type) => {
    render(
      type === "item" ? (
        <AddToCollectionDialog type="item" itemId="i-existing" />
      ) : type === "spellSchool" ? (
        <AddToCollectionDialog type="spellSchool" spellSchoolId="s-existing" />
      ) : type === "companion" ? (
        <AddToCollectionDialog type="companion" companionId="c-existing" />
      ) : type === "ancestry" ? (
        <AddToCollectionDialog type="ancestry" ancestryId="a-existing" />
      ) : (
        <AddToCollectionDialog type="hazard" monsterId="m-existing" />
      ),
      {
        wrapper: createWrapper(),
      }
    );

    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    await screen.findByText("My Monsters");

    fireEvent.change(screen.getByTestId("collection-select"), {
      target: { value: "col-1" },
    });

    expect(
      await screen.findByText(
        `This ${type === "spellSchool" ? "spell school" : type} is already in the selected collection`
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled();
  });

  it.each<
    "monster" | "hazard" | "item" | "spellSchool" | "companion" | "ancestry"
  >(["monster", "hazard", "item", "spellSchool", "companion", "ancestry"])(
    "adds a %s through stable JSON transport",
    async (type) => {
      render(
        type === "item" ? (
          <AddToCollectionDialog type="item" itemId="entity-1" />
        ) : type === "spellSchool" ? (
          <AddToCollectionDialog type="spellSchool" spellSchoolId="entity-1" />
        ) : type === "companion" ? (
          <AddToCollectionDialog type="companion" companionId="entity-1" />
        ) : type === "ancestry" ? (
          <AddToCollectionDialog type="ancestry" ancestryId="entity-1" />
        ) : (
          <AddToCollectionDialog type={type} monsterId="entity-1" />
        ),
        {
          wrapper: createWrapper(),
        }
      );

      fireEvent.click(
        screen.getByRole("button", { name: /add to collection/i })
      );
      await screen.findByText("Empty Collection");

      fireEvent.change(screen.getByTestId("collection-select"), {
        target: { value: "col-2" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledOnce();
      });
      expect(mockFetch).toHaveBeenCalledWith(
        type === "item"
          ? "/_actions/addItemToCollection"
          : type === "spellSchool"
            ? "/_actions/addSpellSchoolToCollection"
            : type === "companion"
              ? "/_actions/addCompanionToCollection"
              : type === "ancestry"
                ? "/_actions/addAncestryToCollection"
                : "/_actions/addMonsterToCollection",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            type === "item"
              ? { itemId: "entity-1", collectionId: "col-2" }
              : type === "spellSchool"
                ? { spellSchoolId: "entity-1", collectionId: "col-2" }
                : type === "companion"
                  ? { companionId: "entity-1", collectionId: "col-2" }
                  : type === "ancestry"
                    ? { ancestryId: "entity-1", collectionId: "col-2" }
                    : { monsterId: "entity-1", collectionId: "col-2" }
          ),
        }
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(mockListOwnCollections).toHaveBeenCalledTimes(2);
    }
  );

  it.each([
    ["monster", "http"],
    ["monster", "network"],
    ["item", "http"],
    ["item", "network"],
    ["spellSchool", "http"],
    ["spellSchool", "network"],
    ["companion", "http"],
    ["companion", "network"],
    ["ancestry", "http"],
    ["ancestry", "network"],
  ])(
    "retains %s selection after %s failure and permits manual retry",
    async (type, failure) => {
      let rejectRequest: (error: Error) => void = () => {};
      let resolveRequest: (response: Response) => void = () => {};
      mockFetch.mockReturnValueOnce(
        new Promise<Response>((resolve, reject) => {
          resolveRequest = resolve;
          rejectRequest = reject;
        })
      );
      render(
        type === "item" ? (
          <AddToCollectionDialog type="item" itemId="entity-1" />
        ) : type === "spellSchool" ? (
          <AddToCollectionDialog type="spellSchool" spellSchoolId="entity-1" />
        ) : type === "companion" ? (
          <AddToCollectionDialog type="companion" companionId="entity-1" />
        ) : type === "ancestry" ? (
          <AddToCollectionDialog type="ancestry" ancestryId="entity-1" />
        ) : (
          <AddToCollectionDialog type="monster" monsterId="entity-1" />
        ),
        {
          wrapper: createWrapper(),
        }
      );
      fireEvent.click(
        screen.getByRole("button", { name: /add to collection/i })
      );
      await screen.findByText("Empty Collection");
      fireEvent.change(screen.getByTestId("collection-select"), {
        target: { value: "col-2" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
      expect(
        await screen.findByRole("button", { name: "Adding..." })
      ).toBeDisabled();
      if (failure === "http")
        resolveRequest(Response.json({ error: "Forbidden" }, { status: 403 }));
      else rejectRequest(new Error("Failed to fetch"));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        failure === "http" ? "Forbidden" : "Failed to fetch"
      );
      expect(screen.getByTestId("collection-select")).toHaveValue("col-2");
      expect(mockFetch).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }
  );
});
