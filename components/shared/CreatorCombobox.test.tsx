import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { User } from "@/lib/types";

const { useSession, getTopItemCreators, searchCreators } = vi.hoisted(() => ({
  useSession: vi.fn(),
  getTopItemCreators: vi.fn(),
  searchCreators: vi.fn(),
}));
vi.mock("next-auth/react", () => ({ useSession }));
vi.mock("./search-creators-action", () => ({
  getTopItemCreators,
  searchCreators,
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
  searchCreators.mockResolvedValue([]);
  fetchMock.mockResolvedValue(Response.json(creators));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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
