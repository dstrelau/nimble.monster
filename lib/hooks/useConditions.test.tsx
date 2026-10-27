import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("next-auth/react", () => ({ useSession }));

import { useConditions } from "./useConditions";

function Conditions() {
  const { creatorConditions, ownConds, officialConds } = useConditions({
    creatorId: "creator & one",
  });
  return (
    <>
      <div data-testid="creator">
        {creatorConditions.data?.map((c) => c.name).join(",")}
      </div>
      <div data-testid="viewer">
        {ownConds.data?.map((c) => c.name).join(",")}
      </div>
      <div data-testid="official">
        {officialConds.isLoading
          ? "Loading"
          : officialConds.data?.map((c) => c.name).join(",")}
      </div>
      {officialConds.isError && (
        <button type="button" onClick={() => officialConds.refetch()}>
          Retry official
        </button>
      )}
      {ownConds.isError && (
        <button type="button" onClick={() => ownConds.refetch()}>
          Retry
        </button>
      )}
    </>
  );
}
const row = (name: string) => [
  { id: name, name, description: name, official: false },
];
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useSession.mockReturnValue({ data: { user: { discordId: "viewer" } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});
function App() {
  return (
    <QueryClientProvider client={client}>
      <Conditions />
    </QueryClientProvider>
  );
}

it("uses encoded bodyless stable GETs with cancellation, separating creator and viewer caches", async () => {
  const fetcher = vi.fn(async (url: string, _options: RequestInit) =>
    Response.json(
      row(
        new URL(url, "https://nimble.nexus").searchParams.get("discordId") ?? ""
      )
    )
  );
  vi.stubGlobal("fetch", fetcher);
  const { rerender } = render(<App />);
  await waitFor(() =>
    expect(screen.getByTestId("creator")).toHaveTextContent("creator & one")
  );
  await waitFor(() =>
    expect(screen.getByTestId("viewer")).toHaveTextContent("viewer")
  );
  expect(fetcher).toHaveBeenCalledWith(
    "/_actions/loadConditionsForDiscordId?discordId=creator+%26+one",
    {
      method: "GET",
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    }
  );
  for (const [, options] of fetcher.mock.calls) {
    expect(options).not.toHaveProperty("headers");
    expect(options).not.toHaveProperty("body");
  }
  useSession.mockReturnValue({ data: { user: { discordId: "other" } } });
  rerender(<App />);
  expect(screen.getByTestId("viewer")).not.toHaveTextContent("viewer");
  await waitFor(() =>
    expect(screen.getByTestId("viewer")).toHaveTextContent("other")
  );
  expect(screen.getByTestId("creator")).toHaveTextContent("creator & one");
  useSession.mockReturnValue({ data: null });
  rerender(<App />);
  expect(screen.getByTestId("viewer")).toBeEmptyDOMElement();
  expect(screen.getByTestId("creator")).toHaveTextContent("creator & one");
});

it("loads shared official conditions over a cancellable bodyless GET and recovers from failure", async () => {
  let finish: (response: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetcher = vi.fn(async (url: string, _options: RequestInit) => {
    if (url === "/_actions/loadOfficialConditions") return pending;
    return Response.json(row("Custom"));
  });
  vi.stubGlobal("fetch", fetcher);
  useSession.mockReturnValue({ data: null });
  const { rerender } = render(<App />);
  expect(screen.getByTestId("official")).toHaveTextContent("Loading");
  finish(Response.json({ error: "Unavailable" }, { status: 503 }));
  const retry = await screen.findByRole("button", { name: "Retry official" });
  expect(screen.getByTestId("creator")).toHaveTextContent("Custom");
  fetcher.mockImplementation(async (url) =>
    Response.json(
      row(url === "/_actions/loadOfficialConditions" ? "Dazed" : "Custom")
    )
  );
  fireEvent.click(retry);
  await waitFor(() =>
    expect(screen.getByTestId("official")).toHaveTextContent("Dazed")
  );
  expect(fetcher).toHaveBeenCalledWith("/_actions/loadOfficialConditions", {
    method: "GET",
    credentials: "same-origin",
    signal: expect.any(AbortSignal),
  });
  for (const [, options] of fetcher.mock.calls) {
    expect(options).not.toHaveProperty("headers");
    expect(options).not.toHaveProperty("body");
  }
  useSession.mockReturnValue({ data: { user: { discordId: "another" } } });
  rerender(<App />);
  expect(screen.getByTestId("official")).toHaveTextContent("Dazed");
  expect(client.getQueryData(["conditions", "official"])).toEqual(row("Dazed"));
});

it("keeps anonymous creator loading and permits recovery from viewer transport failures", async () => {
  let failed = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("discordId=viewer") && failed)
        return Response.json({ error: "Unavailable" }, { status: 503 });
      return Response.json(
        row(
          url.endsWith("discordId=viewer")
            ? "Own condition"
            : "Creator condition"
        )
      );
    })
  );
  render(<App />);
  await waitFor(() =>
    expect(screen.getByTestId("creator")).toHaveTextContent("Creator condition")
  );
  const retry = await screen.findByRole("button", { name: "Retry" });
  failed = false;
  fireEvent.click(retry);
  await waitFor(() =>
    expect(screen.getByTestId("viewer")).toHaveTextContent("Own condition")
  );
});
