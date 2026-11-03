import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { RouteError } from "@/lib/contract";
import { publicSubclassesQueryOptions } from "@/lib/queryOptions";
import type { Subclass } from "@/lib/types";
import { SelectableSubclassGrid } from "./SelectableSubclassGrid";

// Unmigrated sibling queries and the unrelated source menu are not exercised here.
vi.mock("@/app/actions/class", () => ({ listPublicClassesAction: vi.fn() }));
vi.mock("@/app/spell-schools/actions", () => ({
  listPublicSpellSchoolsAction: vi.fn(),
}));
vi.mock("@/lib/services/sources/hooks", () => ({
  useSourcesQuery: () => ({ data: [] }),
  useSourcesForEntityTypeQuery: () => ({ data: [] }),
}));

const createdAt = "2026-01-02T03:04:05.000Z";
const updatedAt = "2026-06-07T08:09:10.000Z";
const subclass: Jsonify<Subclass> = {
  id: "alpha",
  name: "Alpha",
  className: "Berserker",
  visibility: "public",
  createdAt,
  updatedAt,
  creator: {
    id: "owner",
    discordId: "owner",
    username: "owner",
    displayName: "Owner",
    imageUrl: "",
  },
  levels: [
    {
      level: 3,
      abilities: [{ id: "ability", name: "Rage", description: "Gain rage" }],
    },
  ],
  source: {
    id: "src",
    name: "Source",
    abbreviation: "SRC",
    license: "CC",
    link: "https://example.test",
    createdAt,
    updatedAt,
  },
  awards: [
    {
      id: "award",
      slug: "award",
      name: "Award",
      abbreviation: "AW",
      description: "Won",
      url: "https://example.test",
      color: "gold",
      icon: "star",
      createdAt,
      updatedAt,
    },
  ],
  abilityLists: [
    {
      id: "list",
      name: "Options",
      description: "Choices",
      creator: {
        id: "other",
        discordId: "other",
        username: "other",
        displayName: "Other",
        imageUrl: "",
      },
      items: [{ id: "item", name: "Choice", description: "Choose" }],
      createdAt,
      updatedAt,
    },
  ],
};
const clients: QueryClient[] = [];
function client() {
  const result = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(result);
  return result;
}

afterEach(() => {
  cleanup();
  for (const queryClient of clients.splice(0)) queryClient.clear();
  vi.unstubAllGlobals();
});

it("uses a stable cancellable bodyless GET, preserves the cache key and revives all nested dates", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify([subclass])));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  const options = publicSubclassesQueryOptions();
  const [result] = await options.queryFn({ signal });
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe("/_actions/listPublicSubclasses");
  const request = new Request(new URL(url, "https://nimble.nexus"), init);
  expect(request.method).toBe("GET");
  expect(request.body).toBeNull();
  expect(request.headers.has("next-action")).toBe(false);
  expect(request.headers.has("content-type")).toBe(false);
  expect(init.signal).toBe(signal);
  expect(init.credentials).toBe("same-origin");
  expect(options.queryKey).toEqual(["subclasses-all"]);
  expect(options.staleTime).toBe(30000);
  expect(result).toEqual({
    ...subclass,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    source: {
      ...subclass.source,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    },
    awards: subclass.awards?.map((award) => ({
      ...award,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    })),
    abilityLists: subclass.abilityLists.map((list) => ({
      ...list,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    })),
  });
});

it("shows pending data then filters, selects and retains selection after refetch failure/recovery", async () => {
  let finish: (response: Response) => void = () => {};
  const fetch = vi.fn().mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    })
  );
  vi.stubGlobal("fetch", fetch);
  const queryClient = client();
  function Picker() {
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    return (
      <SelectableSubclassGrid
        selectedIds={selectedIds}
        onToggle={(value) => setSelectedIds(new Set([value.id]))}
      />
    );
  }
  render(
    <QueryClientProvider client={queryClient}>
      <Picker />
    </QueryClientProvider>
  );
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  finish(
    new Response(
      JSON.stringify([
        subclass,
        {
          ...subclass,
          id: "zulu",
          name: "Zulu",
          createdAt: "2025-01-01T00:00:00.000Z",
          source: undefined,
          awards: undefined,
          abilityLists: [],
        },
      ])
    )
  );
  const selection = await screen.findByRole("button", { name: "Select Alpha" });
  expect(
    screen.getAllByRole("button", { name: /^Select (Alpha|Zulu)$/ })[0]
  ).toBe(selection);
  fireEvent.click(selection);
  expect(selection).toHaveAttribute("aria-pressed", "true");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Zulu" } });
  expect(
    screen.queryByRole("button", { name: "Select Alpha" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Select Zulu" })
  ).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Read unavailable" }), { status: 500 })
  );
  await act(() =>
    queryClient.invalidateQueries({ queryKey: ["subclasses-all"] })
  );
  expect(await screen.findByText("Read unavailable")).toBeInTheDocument();
  expect(queryClient.getQueryData(["subclasses-all"])).toHaveLength(2);
  fetch.mockResolvedValueOnce(new Response(JSON.stringify([subclass])));
  await act(() =>
    queryClient.invalidateQueries({ queryKey: ["subclasses-all"] })
  );
  expect(
    await screen.findByRole("button", { name: "Select Alpha" })
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByText("Read unavailable")).not.toBeInTheDocument();
});

it("shows an empty result and a typed initial error, then recovers on retry", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 })
    );
  vi.stubGlobal("fetch", fetch);
  const queryClient = client();
  render(
    <QueryClientProvider client={queryClient}>
      <SelectableSubclassGrid selectedIds={new Set()} onToggle={() => {}} />
    </QueryClientProvider>
  );
  expect(await screen.findByText("Unavailable")).toBeInTheDocument();
  const error = queryClient.getQueryState(["subclasses-all"])?.error;
  expect(error).toBeInstanceOf(RouteError);
  expect(error).toMatchObject({ status: 503, code: "HTTP_503" });
  fetch.mockResolvedValueOnce(new Response("[]"));
  await act(() =>
    queryClient.invalidateQueries({ queryKey: ["subclasses-all"] })
  );
  expect(await screen.findByText("No subclasses found.")).toBeInTheDocument();
});

it("cancels the pending read when its last observer unmounts", async () => {
  const fetch = vi.fn().mockImplementation(
    (_url, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        );
      })
  );
  vi.stubGlobal("fetch", fetch);
  const queryClient = client();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <SelectableSubclassGrid selectedIds={new Set()} onToggle={() => {}} />
    </QueryClientProvider>
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const signal = fetch.mock.calls[0][1].signal;
  expect(signal.aborted).toBe(false);
  view.unmount();
  expect(signal.aborted).toBe(true);
});
