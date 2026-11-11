import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminRowActionButton } from "./AdminRowActionButton";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "alert").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("posts each row action to its stable route and refreshes after success", async () => {
  const fetcher = vi.fn(async (_url: string, _init: RequestInit) =>
    Response.json({ success: true })
  );
  vi.stubGlobal("fetch", fetcher);
  render(
    <>
      <AdminRowActionButton action={{ kind: "deleteAward", id: "a-1" }} />
      <AdminRowActionButton action={{ kind: "deleteSource", id: "s-1" }} />
      <AdminRowActionButton
        action={{
          kind: "removeAwardAssociation",
          entityType: "school",
          entityId: "ss-1",
          awardId: "a-1",
        }}
      />
    </>
  );
  for (const name of ["Delete award", "Delete source", "Remove association"]) {
    fireEvent.click(screen.getByRole("button", { name }));
  }
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(3));
  expect(
    fetcher.mock.calls.map(([url, init]) => [
      url,
      JSON.parse(String(init.body)),
    ])
  ).toEqual([
    ["/_actions/deleteAward", { id: "a-1" }],
    ["/_actions/deleteSource", { id: "s-1" }],
    [
      "/_actions/removeAwardAssociation",
      { entityType: "school", entityId: "ss-1", awardId: "a-1" },
    ],
  ]);
  for (const [, init] of fetcher.mock.calls) {
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).has("next-action")).toBe(false);
  }
});

it("disables while pending and surfaces failures without refreshing", async () => {
  let finish: (response: Response) => void = () => undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    )
  );
  render(<AdminRowActionButton action={{ kind: "deleteSource", id: "s-1" }} />);
  const button = screen.getByRole("button", { name: "Delete source" });
  fireEvent.click(button);
  await waitFor(() => expect(button).toBeDisabled());
  finish(
    Response.json(
      { error: "This source is still used by content" },
      { status: 409 }
    )
  );
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      "This source is still used by content"
    )
  );
  expect(button).not.toBeDisabled();
  expect(refresh).not.toHaveBeenCalled();
});
