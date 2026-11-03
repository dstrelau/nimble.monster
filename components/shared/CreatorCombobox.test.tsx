import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { User } from "@/lib/types";

const { useSession, getTopItemCreators } = vi.hoisted(() => ({
  useSession: vi.fn(),
  getTopItemCreators: vi.fn(),
}));
vi.mock("next-auth/react", () => ({ useSession }));
vi.mock("./search-creators-action", () => ({
  getTopItemCreators,
}));

import { CreatorCombobox } from "./CreatorCombobox";

const creators: User[] = [
  { id: "self", discordId: "1", username: "self", displayName: "Me" },
  {
    id: "other",
    discordId: "2",
    username: "other",
    displayName: "Other Creator",
  },
];
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  useSession.mockReturnValue({ data: { user: creators[0] } });
  getTopItemCreators.mockResolvedValue([]);
  fetchMock.mockImplementation(async () => Response.json(creators));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it.each(["monsters", "items"] as const)(
  "searches %s with encoded cancellable GETs and selects a result",
  async (kind) => {
    const onChange = vi.fn();
    const { unmount } = render(
      <CreatorCombobox kind={kind} value={null} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByPlaceholderText("Search creators..."), {
      target: { value: "a+b & 雪" },
    });
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).startsWith("/_actions/searchCreators?")
        )
      ).toBe(true)
    );
    const entry = fetchMock.mock.calls.find(([url]) =>
      String(url).startsWith("/_actions/searchCreators?")
    );
    expect(entry?.[0]).toBe(
      "/_actions/searchCreators?query=a%2Bb+%26+%E9%9B%AA"
    );
    expect(entry?.[1]).toEqual({
      method: "GET",
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    });
    expect(new Headers(entry?.[1]?.headers).has("next-action")).toBe(false);
    fireEvent.click(await screen.findByText("Other Creator"));
    expect(onChange).toHaveBeenCalledWith("other");
    unmount();
    expect(entry?.[1]?.signal?.aborted).toBe(true);
  }
);

it("retains search results on failure, recovers on another query and discards late obsolete results", async () => {
  let resolveLate: (response: Response) => void = () => {};
  fetchMock.mockImplementation(async (url) => {
    const query = new URL(String(url), "http://localhost").searchParams.get(
      "query"
    );
    if (query === "late")
      return new Promise<Response>((resolve) => {
        resolveLate = resolve;
      });
    if (query === "fail")
      return Response.json({ error: "failed" }, { status: 500 });
    return Response.json(creators);
  });
  render(<CreatorCombobox kind="monsters" value={null} onChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("combobox"));
  const input = screen.getByPlaceholderText("Search creators...");
  fireEvent.change(input, { target: { value: "first" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("Other Creator")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "fail" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(screen.getByText("Other Creator")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "late" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  const signal = fetchMock.mock.calls[3][1]?.signal;
  fireEvent.change(input, { target: { value: "recovered" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
  expect(signal?.aborted).toBe(true);
  resolveLate(Response.json([{ ...creators[1], displayName: "Obsolete" }]));
  await waitFor(() =>
    expect(screen.getByText("Other Creator")).toBeInTheDocument()
  );
  expect(screen.queryByText("Obsolete")).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: "" } });
  await waitFor(() =>
    expect(fetchMock.mock.calls[4][1]?.signal?.aborted).toBe(true)
  );
});

it("loads and selects suggestions through a cancellable stable GET, without next-action", async () => {
  const onChange = vi.fn();
  const { unmount } = render(
    <CreatorCombobox kind="monsters" value={null} onChange={onChange} />
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/_actions/getTopMonsterCreators");
  expect(init).toEqual({
    method: "GET",
    credentials: "same-origin",
    signal: expect.any(AbortSignal),
  });
  expect(new Headers(init?.headers).has("next-action")).toBe(false);
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByText("Other Creator"));
  expect(onChange).toHaveBeenCalledWith("other");
  expect(getTopItemCreators).not.toHaveBeenCalled();
  unmount();
  expect(init?.signal?.aborted).toBe(true);
});

it("keeps the picker usable on a failed read and retries after remount", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ error: "Internal Server Error" }, { status: 500 })
  );
  const props = {
    kind: "monsters",
    value: null,
    onChange: vi.fn(),
  } satisfies Parameters<typeof CreatorCombobox>[0];
  const first = render(<CreatorCombobox {...props} />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option")).toHaveLength(2);
  expect(screen.queryByText("Other Creator")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Me"));
  expect(props.onChange).toHaveBeenCalledWith("self");
  first.unmount();
  render(<CreatorCombobox {...props} />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(await screen.findByText("Other Creator")).toBeInTheDocument();
});

it("discards late monster suggestions after switching to the unchanged item transport", async () => {
  let resolveRead: (response: Response) => void = () => {};
  fetchMock.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveRead = resolve;
    })
  );
  getTopItemCreators.mockResolvedValue([
    { ...creators[1], displayName: "Item Creator" },
  ]);
  const props = { value: null, onChange: vi.fn() };
  const view = render(<CreatorCombobox kind="monsters" {...props} />);
  view.rerender(<CreatorCombobox kind="items" {...props} />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(await screen.findByText("Item Creator")).toBeInTheDocument();
  resolveRead(Response.json(creators));
  await waitFor(() =>
    expect(screen.queryByText("Other Creator")).not.toBeInTheDocument()
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("keeps anonymous All Creators usable while pending and shows public suggestions when ready", async () => {
  useSession.mockReturnValue({ data: null });
  let resolveRead: (response: Response) => void = () => {};
  fetchMock.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveRead = resolve;
    })
  );
  const onChange = vi.fn();
  render(<CreatorCombobox kind="monsters" value={null} onChange={onChange} />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option")).toHaveLength(1);
  resolveRead(Response.json(creators));
  expect(await screen.findByText("Other Creator")).toBeInTheDocument();
  expect(screen.getAllByRole("option")).toHaveLength(3);
  fireEvent.click(screen.getByRole("option", { name: "All Creators" }));
  expect(onChange).toHaveBeenCalledWith(null);
});
