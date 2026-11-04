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
import { publicSpellSchoolsQueryOptions } from "@/lib/queryOptions";
import type { SpellSchool } from "@/lib/types";
import { SelectableSpellSchoolGrid } from "./SelectableSpellSchoolGrid";

// Condition definitions are a separate, already-migrated read.
vi.mock("@/lib/hooks/useConditions", () => ({
  useConditions: () => ({ allConditions: [] }),
}));

const date = "2026-01-02T03:04:05.000Z";
const entity: Jsonify<SpellSchool> = {
  id: "alpha",
  name: "Alpha",
  description: "A school",
  visibility: "public",
  creator: {
    id: "owner",
    discordId: "owner",
    username: "owner",
    displayName: "Owner",
    imageUrl: "",
  },
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
  spells: [
    {
      id: "spell",
      schoolId: "alpha",
      name: "Fire",
      tier: 1,
      actions: 1,
      reaction: false,
      createdAt: date,
      updatedAt: date,
    },
  ],
};
let client: QueryClient;
afterEach(() => {
  cleanup();
  client?.clear();
  vi.unstubAllGlobals();
});
it("uses a stable cancellable bodyless GET and revives school, spell, source and award dates", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify([entity])));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  const options = publicSpellSchoolsQueryOptions();
  const [result] = await options.queryFn({ signal });
  const [url, init] = fetch.mock.calls[0];
  const request = new Request(new URL(url, "https://nimble.nexus"), init);
  expect(url).toBe("/_actions/listPublicSpellSchools");
  expect(request.method).toBe("GET");
  expect(request.body).toBeNull();
  expect(request.headers.has("next-action")).toBe(false);
  expect(request.headers.has("content-type")).toBe(false);
  expect(init.signal).toBe(signal);
  expect(init.credentials).toBe("same-origin");
  expect(options.queryKey).toEqual(["spellSchools-all"]);
  expect(options.staleTime).toBe(30000);
  for (const value of [
    result,
    result.spells[0],
    result.source,
    result.awards?.[0],
  ]) {
    expect(value?.createdAt).toEqual(new Date(date));
    expect(value?.updatedAt).toEqual(new Date(date));
  }
});
it("loads the real picker, searches spell names, selects, preserves cached data on failure and recovers", async () => {
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
      <SelectableSpellSchoolGrid
        selectedIds={new Set(["alpha"])}
        onToggle={toggle}
      />
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
          spells: [],
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ])
    )
  );
  const button = await screen.findByRole("button", { name: "Select Alpha" });
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("button", { name: /^Select / })[0]).toBe(button);
  fireEvent.click(button);
  expect(toggle.mock.calls[0][0].spells[0].createdAt).toEqual(new Date(date));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Fire" } });
  expect(
    screen.getByRole("button", { name: "Select Alpha" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Select Zulu" })
  ).not.toBeInTheDocument();
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 })
  );
  await act(() => client.invalidateQueries({ queryKey: ["spellSchools-all"] }));
  expect(await screen.findByText("Unavailable")).toBeInTheDocument();
  expect(client.getQueryData(["spellSchools-all"])).toHaveLength(2);
  expect(client.getQueryState(["spellSchools-all"])?.error).toMatchObject({
    status: 503,
    code: "HTTP_503",
  });
  fetch.mockResolvedValueOnce(new Response(JSON.stringify([entity])));
  await act(() => client.invalidateQueries({ queryKey: ["spellSchools-all"] }));
  expect(
    await screen.findByRole("button", { name: "Select Alpha" })
  ).toHaveAttribute("aria-pressed", "true");
});
