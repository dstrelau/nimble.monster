import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ownCollectionsQueryOptions } from "@/app/collections/ownCollectionsQueryOptions";

const { mockReadFetch, mockFetch, mockSession } = vi.hoisted(() => ({
  mockReadFetch: vi.fn(),
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

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
) {
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
      createdAt: "2026-09-01T12:00:00.000Z",
      monsters: [{ id: "m-existing", createdAt: "2026-09-02T12:00:00.000Z" }],
      items: [
        {
          id: "i-existing",
          createdAt: "2026-09-03T12:00:00.000Z",
          updatedAt: "2026-09-04T12:00:00.000Z",
        },
      ],
      companions: [{ id: "c-existing" }],
      ancestries: [
        {
          id: "a-existing",
          createdAt: "2026-09-05T12:00:00.000Z",
          updatedAt: "2026-09-06T12:00:00.000Z",
        },
      ],
      backgrounds: [
        {
          id: "b-existing",
          createdAt: "2026-09-07T12:00:00.000Z",
          updatedAt: "2026-09-08T12:00:00.000Z",
        },
      ],
      subclasses: [
        { id: "sc-existing", createdAt: "2026-09-09T12:00:00.000Z" },
      ],
      spellSchools: [
        { id: "s-existing", createdAt: "2026-09-10T12:00:00.000Z" },
      ],
      classes: [{ id: "cl-existing", createdAt: "2026-09-11T12:00:00.000Z" }],
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
      classes: [],
    },
  ],
};

describe("AddToCollectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "owner" } },
    });
    vi.stubGlobal("fetch", (url: string, init: RequestInit) =>
      url === "/_actions/listOwnCollections"
        ? mockReadFetch(url, init)
        : mockFetch(url, init)
    );
    mockFetch.mockResolvedValue(Response.json({ success: true }));
    mockReadFetch.mockImplementation(async () => Response.json(COLLECTIONS));
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

  it("loads through a cancellable bodyless stable GET, never next-action", async () => {
    render(<AddToCollectionDialog type="monster" monsterId="m1" />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    await screen.findByText("My Monsters");
    expect(mockReadFetch).toHaveBeenCalledWith("/_actions/listOwnCollections", {
      method: "GET",
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("revives every overview/member timestamp without inventing optional dates", async () => {
    const client = new QueryClient();
    const result = await client.fetchQuery(ownCollectionsQueryOptions("owner"));
    const collection = result.collections[0];
    expect(collection.createdAt).toEqual(new Date("2026-09-01T12:00:00.000Z"));
    expect(collection.monsters[0].createdAt).toEqual(
      new Date("2026-09-02T12:00:00.000Z")
    );
    expect(collection.items[0].createdAt).toEqual(
      new Date("2026-09-03T12:00:00.000Z")
    );
    expect(collection.items[0].updatedAt).toEqual(
      new Date("2026-09-04T12:00:00.000Z")
    );
    expect(collection.ancestries[0].createdAt).toEqual(
      new Date("2026-09-05T12:00:00.000Z")
    );
    expect(collection.ancestries[0].updatedAt).toEqual(
      new Date("2026-09-06T12:00:00.000Z")
    );
    expect(collection.backgrounds[0].createdAt).toEqual(
      new Date("2026-09-07T12:00:00.000Z")
    );
    expect(collection.backgrounds[0].updatedAt).toEqual(
      new Date("2026-09-08T12:00:00.000Z")
    );
    expect(collection.subclasses[0].createdAt).toEqual(
      new Date("2026-09-09T12:00:00.000Z")
    );
    expect(collection.spellSchools[0].createdAt).toEqual(
      new Date("2026-09-10T12:00:00.000Z")
    );
    expect(collection.classes[0].createdAt).toEqual(
      new Date("2026-09-11T12:00:00.000Z")
    );
    expect(result.collections[1].createdAt).toBeUndefined();
    client.clear();
  });

  it.each(["loading", "unauthenticated"])(
    "does not fetch private options while %s",
    (status) => {
      mockSession.mockReturnValue({ status, data: null });
      render(<AddToCollectionDialog type="monster" monsterId="m1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(mockReadFetch).not.toHaveBeenCalled();
    }
  );

  it("isolates account switches, clears old selection and hides private data on sign-out", async () => {
    const { rerender } = render(
      <AddToCollectionDialog type="monster" monsterId="m1" />,
      { wrapper: createWrapper() }
    );
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    await screen.findByText("My Monsters");
    fireEvent.change(screen.getByTestId("collection-select"), {
      target: { value: "col-1" },
    });
    mockSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "other" } },
    });
    mockReadFetch.mockImplementation(async () =>
      Response.json({ success: true, collections: [] })
    );
    rerender(<AddToCollectionDialog type="monster" monsterId="m1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    await waitFor(() => expect(mockReadFetch).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("My Monsters")).not.toBeInTheDocument();
    expect(screen.getByTestId("collection-select")).toHaveValue("");
    mockSession.mockReturnValue({ status: "unauthenticated", data: null });
    rerender(<AddToCollectionDialog type="monster" monsterId="m1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("retains options and selection after a failed background read, then recovers", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<AddToCollectionDialog type="monster" monsterId="m1" />, {
      wrapper: createWrapper(client),
    });
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    await screen.findByText("Empty Collection");
    fireEvent.change(screen.getByTestId("collection-select"), {
      target: { value: "col-2" },
    });
    mockReadFetch.mockResolvedValueOnce(
      Response.json({ error: "Temporary failure" }, { status: 503 })
    );
    await client.invalidateQueries({
      queryKey: ownCollectionsQueryOptions("owner").queryKey,
    });
    expect(screen.getByTestId("collection-select")).toHaveValue("col-2");
    expect(screen.getByText("Empty Collection")).toBeInTheDocument();
    await client.invalidateQueries({
      queryKey: ownCollectionsQueryOptions("owner").queryKey,
    });
    await waitFor(() =>
      expect(
        client.getQueryState(ownCollectionsQueryOptions("owner").queryKey)
          ?.status
      ).toBe("success")
    );
    expect(screen.getByTestId("collection-select")).toHaveValue("col-2");
  });

  it("cancels an in-flight read on account change and never displays its late result", async () => {
    let finish: (response: Response) => void = () => {};
    mockReadFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      })
    );
    const { rerender } = render(
      <AddToCollectionDialog type="monster" monsterId="m1" />,
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(mockReadFetch).toHaveBeenCalledOnce());
    const signal: AbortSignal = mockReadFetch.mock.calls[0][1].signal;
    mockSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "other" } },
    });
    mockReadFetch.mockImplementation(async () =>
      Response.json({ success: true, collections: [] })
    );
    rerender(<AddToCollectionDialog type="monster" monsterId="m1" />);
    expect(signal.aborted).toBe(true);
    finish(Response.json(COLLECTIONS));
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    await waitFor(() => expect(mockReadFetch).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("My Monsters")).not.toBeInTheDocument();
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

  it.each<
    | "hazard"
    | "item"
    | "spellSchool"
    | "companion"
    | "ancestry"
    | "background"
    | "subclass"
  >([
    "hazard",
    "item",
    "spellSchool",
    "companion",
    "ancestry",
    "background",
    "subclass",
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
      ) : type === "background" ? (
        <AddToCollectionDialog type="background" backgroundId="b-existing" />
      ) : type === "subclass" ? (
        <AddToCollectionDialog type="subclass" subclassId="sc-existing" />
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
    | "monster"
    | "hazard"
    | "item"
    | "spellSchool"
    | "companion"
    | "ancestry"
    | "background"
    | "subclass"
  >([
    "monster",
    "hazard",
    "item",
    "spellSchool",
    "companion",
    "ancestry",
    "background",
    "subclass",
  ])("adds a %s through stable JSON transport", async (type) => {
    render(
      type === "item" ? (
        <AddToCollectionDialog type="item" itemId="entity-1" />
      ) : type === "spellSchool" ? (
        <AddToCollectionDialog type="spellSchool" spellSchoolId="entity-1" />
      ) : type === "companion" ? (
        <AddToCollectionDialog type="companion" companionId="entity-1" />
      ) : type === "ancestry" ? (
        <AddToCollectionDialog type="ancestry" ancestryId="entity-1" />
      ) : type === "background" ? (
        <AddToCollectionDialog type="background" backgroundId="entity-1" />
      ) : type === "subclass" ? (
        <AddToCollectionDialog type="subclass" subclassId="entity-1" />
      ) : (
        <AddToCollectionDialog type={type} monsterId="entity-1" />
      ),
      {
        wrapper: createWrapper(),
      }
    );

    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
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
              : type === "background"
                ? "/_actions/addBackgroundToCollection"
                : type === "subclass"
                  ? "/_actions/addSubclassToCollection"
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
                  : type === "background"
                    ? { backgroundId: "entity-1", collectionId: "col-2" }
                    : type === "subclass"
                      ? { subclassId: "entity-1", collectionId: "col-2" }
                      : { monsterId: "entity-1", collectionId: "col-2" }
        ),
      }
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(mockReadFetch).toHaveBeenCalledTimes(2);
  });

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
    ["background", "http"],
    ["background", "network"],
    ["subclass", "http"],
    ["subclass", "network"],
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
        ) : type === "background" ? (
          <AddToCollectionDialog type="background" backgroundId="entity-1" />
        ) : type === "subclass" ? (
          <AddToCollectionDialog type="subclass" subclassId="entity-1" />
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
