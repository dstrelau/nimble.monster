import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { User } from "@/lib/types";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { FeatureFlagCard } from "./FeatureFlagCard";

const enabled: User = {
  id: "enabled",
  username: "enabled",
  displayName: "Already enabled",
  discordId: "1",
};
const candidate: User = {
  id: "candidate",
  username: "candidate",
  displayName: "Candidate",
  discordId: "2",
};
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(Response.json([enabled, candidate]));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("searches with a trimmed stable GET, excludes enabled users and retains the existing separate mutation", async () => {
  const { unmount } = render(
    <FeatureFlagCard feature="field-guide" users={[enabled]} />
  );
  fireEvent.click(screen.getByRole("combobox"));
  const input = screen.getByPlaceholderText("Search users...");
  fireEvent.change(input, { target: { value: "  a+b & 雪  " } });
  const option = await screen.findByRole("option", {
    name: /Candidate.*@candidate/,
  });
  expect(
    screen.queryByRole("option", { name: /Already enabled/ })
  ).not.toBeInTheDocument();
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/_actions/searchCreators?query=a%2Bb+%26+%E9%9B%AA"
  );
  const init = fetchMock.mock.calls[0][1];
  expect(init).toEqual({
    method: "GET",
    credentials: "same-origin",
    signal: expect.any(AbortSignal),
  });
  expect(new Headers(init?.headers).has("next-action")).toBe(false);
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  fireEvent.click(option);
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  expect(fetchMock.mock.calls[1][0]).toBe("/_actions/updateFeatureFlag");
  expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
    userId: "candidate",
    feature: "field-guide",
    enabled: true,
  });
  unmount();
  expect(init?.signal?.aborted).toBe(true);
});

it("handles failed reads without losing results, retries on a new query and cancels obsolete searches", async () => {
  render(<FeatureFlagCard feature="field-guide" users={[]} />);
  fireEvent.click(screen.getByRole("combobox"));
  const input = screen.getByPlaceholderText("Search users...");
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "first" } });
  expect(
    await screen.findByRole("option", { name: /Candidate.*@candidate/ })
  ).toBeInTheDocument();
  const firstSignal = fetchMock.mock.calls[0][1]?.signal;
  fetchMock.mockRejectedValueOnce(new TypeError("Network failed"));
  fireEvent.change(input, { target: { value: "failure" } });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(firstSignal?.aborted).toBe(true);
  expect(
    screen.getByRole("option", { name: /Candidate.*@candidate/ })
  ).toBeInTheDocument();
  fetchMock.mockResolvedValueOnce(
    Response.json([{ ...candidate, displayName: "Recovered" }])
  );
  fireEvent.change(input, { target: { value: "recover" } });
  expect(
    await screen.findByRole("option", { name: /Recovered.*@candidate/ })
  ).toBeInTheDocument();
  fireEvent.change(input, { target: { value: " " } });
  await waitFor(() =>
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  );
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
