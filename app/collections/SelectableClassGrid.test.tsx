import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { publicClassesQueryOptions } from "@/lib/queryOptions";
import type { Class } from "@/lib/types";
import { SelectableClassGrid } from "./SelectableClassGrid";

vi.mock("@/app/spell-schools/actions", () => ({
  listPublicSpellSchoolsAction: vi.fn(),
}));
vi.mock("@/lib/services/sources/hooks", () => ({
  useSourcesQuery: () => ({ data: [] }),
  useSourcesForEntityTypeQuery: () => ({ data: [] }),
}));
const date = "2026-01-02T03:04:05.000Z";
const creator = {
  id: "owner",
  discordId: "owner",
  username: "owner",
  displayName: "Owner",
  imageUrl: "",
};
const entity: Jsonify<Class> = {
  id: "alpha",
  name: "Alpha",
  subclassNamePreface: "",
  description: "A class",
  visibility: "public",
  hitDie: "d8",
  startingHp: 13,
  keyStats: ["DEX"],
  saves: { STR: 0, DEX: 1, INT: 0, WIL: 0 },
  armor: [],
  weapons: [],
  startingGear: [],
  levels: [],
  creator,
  createdAt: date,
  updatedAt: date,
  source: {
    id: "source",
    name: "Source",
    abbreviation: "SRC",
    license: "CC",
    link: "https://example.test",
    createdAt: date,
    updatedAt: date,
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
      createdAt: date,
      updatedAt: date,
    },
  ],
  abilityLists: [
    {
      id: "list",
      name: "Choices",
      description: "Options",
      creator,
      createdAt: date,
      updatedAt: date,
      items: [],
    },
  ],
};
let client: QueryClient;
afterEach(() => {
  cleanup();
  client?.clear();
  vi.unstubAllGlobals();
});

it("uses a stable cancellable bodyless GET and revives class and relationship dates", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify([entity])));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  const options = publicClassesQueryOptions();
  const [result] = await options.queryFn({ signal });
  const [url, init] = fetch.mock.calls[0];
  const request = new Request(new URL(url, "https://nimble.nexus"), init);
  expect(url).toBe("/_actions/listPublicClasses");
  expect(request.method).toBe("GET");
  expect(request.body).toBeNull();
  expect(request.headers.has("next-action")).toBe(false);
  expect(request.headers.has("content-type")).toBe(false);
  expect(init.signal).toBe(signal);
  expect(init.credentials).toBe("same-origin");
  expect(options.queryKey).toEqual(["classes-all"]);
  expect(options.staleTime).toBe(30000);
  expect(result.createdAt).toEqual(new Date(date));
  expect(result.updatedAt).toEqual(new Date(date));
  expect(result.source?.createdAt).toEqual(new Date(date));
  expect(result.source?.updatedAt).toEqual(new Date(date));
  expect(result.awards?.[0].createdAt).toEqual(new Date(date));
  expect(result.awards?.[0].updatedAt).toEqual(new Date(date));
  expect(result.abilityLists[0].createdAt).toEqual(new Date(date));
  expect(result.abilityLists[0].updatedAt).toEqual(new Date(date));
});

it("loads the real picker, filters and selects, retains cached data on failure and recovers", async () => {
  let finish: (response: Response) => void = () => {};
  const fetch = vi.fn().mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    })
  );
  vi.stubGlobal("fetch", fetch);
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const toggle = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <SelectableClassGrid selectedIds={new Set(["alpha"])} onToggle={toggle} />
    </QueryClientProvider>
  );
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  finish(
    new Response(
      JSON.stringify([
        entity,
        {
          ...entity,
          id: "z",
          name: "Zulu",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ])
    )
  );
  const button = await screen.findByRole("button", { name: "Select Alpha" });
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("button", { name: /^Select / })[0]).toBe(button);
  fireEvent.click(button);
  expect(toggle.mock.calls[0][0].createdAt).toEqual(new Date(date));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Zulu" } });
  expect(
    screen.queryByRole("button", { name: "Select Alpha" })
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 })
  );
  await act(() => client.invalidateQueries({ queryKey: ["classes-all"] }));
  expect(await screen.findByText("Unavailable")).toBeInTheDocument();
  expect(client.getQueryData(["classes-all"])).toHaveLength(2);
  expect(client.getQueryState(["classes-all"])?.error).toMatchObject({
    status: 503,
    code: "HTTP_503",
  });
  fetch.mockResolvedValueOnce(new Response(JSON.stringify([entity])));
  await act(() => client.invalidateQueries({ queryKey: ["classes-all"] }));
  expect(
    await screen.findByRole("button", { name: "Select Alpha" })
  ).toHaveAttribute("aria-pressed", "true");
});
